import { db, storage } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

const logger = new Logger('MenuHandlers');

/**
 * Add menu item to service (SuperAdmin/AccountManager only)
 */
export async function addMenuItem(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { serviceId } = req.params;
    const { name, description, basePrice, image } = req.body;

    // Validate required fields
    if (!name || basePrice === undefined) {
      return sendError(res, new ValidationError('Name and basePrice are required'));
    }

    logger.info('Adding menu item', { serviceId, itemName: name, userId: req.user.uid });

    // Get service to verify it exists
    const serviceDoc = await db.collection('services').doc(serviceId).get();
    if (!serviceDoc.exists) {
      return sendError(res, new ValidationError('Service not found'));
    }

    const menuItemId = uuidv4();
    let imageUrl: string | undefined;

    // Handle image upload if provided
    if (image) {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(image.split(',')[1], 'base64');

        // Optimize image with sharp
        const optimized = await sharp(buffer).resize(200, 200, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();

        // Upload to Firebase Storage
        const bucket = storage.bucket();
        const file = bucket.file(`menu-items/${serviceId}/${menuItemId}.jpg`);

        await file.save(optimized, {
          metadata: {
            contentType: 'image/jpeg',
          },
        });

        // Get signed URL
        const [url] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days
        });

        imageUrl = url;
      } catch (imageError) {
        logger.error('Image upload failed', imageError);
        // Continue without image if upload fails
      }
    }

    // Create menu item document
    const menuItemData = {
      menuItemId,
      name,
      description: description || null,
      basePrice: parseFloat(basePrice),
      image: imageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    await db
      .collection('services')
      .doc(serviceId)
      .collection('menuItems')
      .doc(menuItemId)
      .set(menuItemData);

    logger.info('Menu item added successfully', { menuItemId, serviceId });
    return sendSuccess(res, { menuItemId, ...menuItemData }, 'Menu item added successfully');
  } catch (error) {
    logger.error('Error adding menu item:', error);
    return sendError(res, error);
  }
}

/**
 * Get menu items for a service
 */
export async function getMenuItems(req: AuthRequest, res: Response) {
  try {
    const { serviceId } = req.params;

    const snapshot = await db
      .collection('services')
      .doc(serviceId)
      .collection('menuItems')
      .get();

    const menuItems = snapshot.docs.map((doc) => ({
      menuItemId: doc.id,
      ...doc.data(),
    }));

    return sendSuccess(res, { menuItems, count: menuItems.length });
  } catch (error) {
    logger.error('Error getting menu items:', error);
    return sendError(res, error);
  }
}

/**
 * Update menu item (SuperAdmin/AccountManager only)
 */
export async function updateMenuItem(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { serviceId, menuItemId } = req.params;
    const { name, description, basePrice, image } = req.body;

    // Validate at least one field is provided
    if (!name && !description && basePrice === undefined && !image) {
      return sendError(res, new ValidationError('At least one field must be updated'));
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice);

    // Handle image update if provided
    if (image) {
      try {
        const buffer = Buffer.from(image.split(',')[1], 'base64');
        const optimized = await sharp(buffer).resize(200, 200, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();

        const bucket = storage.bucket();
        const file = bucket.file(`menu-items/${serviceId}/${menuItemId}.jpg`);

        await file.save(optimized, {
          metadata: {
            contentType: 'image/jpeg',
          },
        });

        const [url] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 24 * 60 * 60 * 1000,
        });

        updateData.image = url;
      } catch (imageError) {
        logger.error('Image update failed', imageError);
      }
    }

    await db
      .collection('services')
      .doc(serviceId)
      .collection('menuItems')
      .doc(menuItemId)
      .update(updateData);

    logger.info('Menu item updated', { menuItemId, serviceId });
    return sendSuccess(res, updateData, 'Menu item updated successfully');
  } catch (error) {
    logger.error('Error updating menu item:', error);
    return sendError(res, error);
  }
}

/**
 * Get SP's custom menu for a service
 */
export async function getSPMenu(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { serviceId } = req.params;

    // Get master menu
    const masterMenuSnapshot = await db
      .collection('services')
      .doc(serviceId)
      .collection('menuItems')
      .get();

    const masterMenu = masterMenuSnapshot.docs.map((doc) => ({
      menuItemId: doc.id,
      ...doc.data(),
    }));

    // Get SP's custom menu
    const spMenuSnapshot = await db
      .collection('serviceProviders')
      .doc(req.user.uid)
      .collection('menus')
      .doc(serviceId)
      .collection('items')
      .get();

    const spMenu = spMenuSnapshot.docs.map((doc) => ({
      menuItemId: doc.id,
      ...doc.data(),
    }));

    return sendSuccess(res, { masterMenu, spMenu });
  } catch (error) {
    logger.error('Error getting SP menu:', error);
    return sendError(res, error);
  }
}

/**
 * Update SP's menu item (price and active status)
 */
export async function updateSPMenuItem(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { serviceId, menuItemId } = req.params;
    const { spPrice, isActive } = req.body;

    // Validate input
    if (spPrice === undefined && isActive === undefined) {
      return sendError(res, new ValidationError('Either spPrice or isActive must be provided'));
    }

    if (spPrice !== undefined && spPrice < 0) {
      return sendError(res, new ValidationError('Price cannot be negative'));
    }

    const updateData: any = {};
    if (spPrice !== undefined) updateData.spPrice = parseFloat(spPrice);
    if (isActive !== undefined) updateData.isActive = isActive;

    // Get or create SP menu item
    const itemRef = db
      .collection('serviceProviders')
      .doc(req.user.uid)
      .collection('menus')
      .doc(serviceId)
      .collection('items')
      .doc(menuItemId);

    const itemDoc = await itemRef.get();

    if (itemDoc.exists) {
      // Update existing
      await itemRef.update(updateData);
    } else {
      // Create new with defaults
      const masterItem = await db
        .collection('services')
        .doc(serviceId)
        .collection('menuItems')
        .doc(menuItemId)
        .get();

      if (!masterItem.exists) {
        return sendError(res, new ValidationError('Menu item not found'));
      }

      const masterData = masterItem.data();
      await itemRef.set({
        menuItemId,
        spPrice: updateData.spPrice || masterData?.basePrice,
        isActive: updateData.isActive !== undefined ? updateData.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    logger.info('SP menu item updated', { serviceId, menuItemId, userId: req.user.uid });
    return sendSuccess(res, updateData, 'Menu item updated successfully');
  } catch (error) {
    logger.error('Error updating SP menu item:', error);
    return sendError(res, error);
  }
}

/**
 * Request new menu item (ServiceProvider)
 */
export async function requestMenuItemCreation(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { serviceId, name, basePrice, image } = req.body;

    // Validate required fields
    if (!serviceId || !name || basePrice === undefined) {
      return sendError(res, new ValidationError('serviceId, name, and basePrice are required'));
    }

    logger.info('Menu item request created', { serviceId, itemName: name, spId: req.user.uid });

    // Get SP details
    const spDoc = await db.collection('serviceProviders').doc(req.user.uid).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('ServiceProvider not found'));
    }

    const spData = spDoc.data();

    // Get service details
    const serviceDoc = await db.collection('services').doc(serviceId).get();
    if (!serviceDoc.exists) {
      return sendError(res, new ValidationError('Service not found'));
    }

    const serviceData = serviceDoc.data();

    const requestId = uuidv4();
    let imageUrl: string | undefined;

    // Handle image if provided
    if (image) {
      try {
        const buffer = Buffer.from(image.split(',')[1], 'base64');
        const optimized = await sharp(buffer).resize(200, 200, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();

        const bucket = storage.bucket();
        const file = bucket.file(`menu-item-requests/${serviceId}/${requestId}.jpg`);

        await file.save(optimized, {
          metadata: {
            contentType: 'image/jpeg',
          },
        });

        const [url] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 24 * 60 * 60 * 1000,
        });

        imageUrl = url;
      } catch (imageError) {
        logger.error('Image upload failed for request', imageError);
      }
    }

    // Create request document
    const requestData = {
      requestId,
      serviceId,
      serviceName: serviceData?.name || '',
      spId: req.user.uid,
      spName: spData?.businessName || spData?.name || '',
      spEmail: spData?.email || '',
      name,
      basePrice: parseFloat(basePrice),
      image: imageUrl || null,
      status: 'PENDING',
      requestedAt: new Date(),
    };

    await db.collection('menuItemRequests').doc(requestId).set(requestData);

    logger.info('Menu item request created successfully', { requestId, serviceId });
    return sendSuccess(res, requestData, 'Request submitted successfully');
  } catch (error) {
    logger.error('Error creating menu item request:', error);
    return sendError(res, error);
  }
}

/**
 * Get pending menu item requests (SuperAdmin/AccountManager)
 */
export async function getPendingMenuItemRequests(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const snapshot = await db.collection('menuItemRequests').where('status', '==', 'PENDING').get();

    const requests = snapshot.docs.map((doc) => ({
      ...doc.data(),
    }));

    return sendSuccess(res, {
      requests,
      count: requests.length,
    });
  } catch (error) {
    logger.error('Error getting pending requests:', error);
    return sendError(res, error);
  }
}

/**
 * Approve menu item request (SuperAdmin/AccountManager)
 */
export async function approveMenuItemRequest(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { requestId } = req.params;

    // Get request
    const requestDoc = await db.collection('menuItemRequests').doc(requestId).get();
    if (!requestDoc.exists) {
      return sendError(res, new ValidationError('Request not found'));
    }

    const request = requestDoc.data() as any;

    // Add to master menu
    const menuItemId = uuidv4();
    const menuItemData = {
      menuItemId,
      name: request.name,
      basePrice: request.basePrice,
      image: request.image || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db
      .collection('services')
      .doc(request.serviceId)
      .collection('menuItems')
      .doc(menuItemId)
      .set(menuItemData);

    // Add to requesting SP's menu
    await db
      .collection('serviceProviders')
      .doc(request.spId)
      .collection('menus')
      .doc(request.serviceId)
      .collection('items')
      .doc(menuItemId)
      .set({
        menuItemId,
        spPrice: request.basePrice,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // Update request status
    await db.collection('menuItemRequests').doc(requestId).update({
      status: 'APPROVED',
      reviewedAt: new Date(),
      reviewedBy: req.user.uid,
      reviewerName: req.user.name || 'Admin',
    });

    logger.info('Menu item request approved', { requestId });

    // TODO: Send email notification to all SPs of this service

    return sendSuccess(res, { status: 'APPROVED' }, 'Request approved successfully');
  } catch (error) {
    logger.error('Error approving request:', error);
    return sendError(res, error);
  }
}

/**
 * Reject menu item request (SuperAdmin/AccountManager)
 */
export async function rejectMenuItemRequest(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { requestId } = req.params;
    const { rejectionReason } = req.body;

    const requestDoc = await db.collection('menuItemRequests').doc(requestId).get();
    if (!requestDoc.exists) {
      return sendError(res, new ValidationError('Request not found'));
    }

    // Update request status
    await db.collection('menuItemRequests').doc(requestId).update({
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewedBy: req.user.uid,
      reviewerName: req.user.name || 'Admin',
      rejectionReason: rejectionReason || null,
    });

    logger.info('Menu item request rejected', { requestId });

    // TODO: Send email notification to SP

    return sendSuccess(res, { status: 'REJECTED' }, 'Request rejected successfully');
  } catch (error) {
    logger.error('Error rejecting request:', error);
    return sendError(res, error);
  }
}

/**
 * Get all menu item requests with filters
 */
export async function getMenuItemRequests(req: AuthRequest, res: Response) {
  try {
    const { status, serviceId } = req.query;

    let query: any = db.collection('menuItemRequests');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (serviceId) {
      query = query.where('serviceId', '==', serviceId);
    }

    const snapshot = await query.get();
    const requests = snapshot.docs.map((doc) => doc.data());

    return sendSuccess(res, {
      requests,
      count: requests.length,
    });
  } catch (error) {
    logger.error('Error getting requests:', error);
    return sendError(res, error);
  }
}
