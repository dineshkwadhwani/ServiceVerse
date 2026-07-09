import * as functions from 'firebase-functions';
import { db, storage } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

const logger = new Logger('ServiceHandlers');

/**
 * Create a new service (SuperAdmin only)
 */
export async function createService(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const {
      name,
      description,
      fromEmail,
      fromName,
      gstPercentage,
      defaultCommission,
      colorTheme,
    } = req.body;

    // Validate required fields
    if (!name || !description || !fromEmail || !fromName) {
      return sendError(
        res,
        new ValidationError('Missing required fields')
      );
    }

    logger.info('Creating new service', {
      userId: req.user.uid,
      serviceName: name,
    });

    // Generate service ID
    const serviceId = uuidv4();

    // TODO: Handle file uploads for logo and heroImage
    // For now, use placeholder URLs
    const logoUrl = 'https://via.placeholder.com/200?text=Logo';
    const heroImageUrl = 'https://via.placeholder.com/1200x400?text=Hero';

    // Create service document
    const serviceData = {
      serviceId,
      name,
      description,
      logo: logoUrl,
      heroImage: heroImageUrl,
      colorTheme,
      fromEmail,
      fromName,
      gstPercentage: parseFloat(gstPercentage),
      defaultCommission: {
        type: defaultCommission.type,
        value: parseFloat(defaultCommission.value),
        active: defaultCommission.active !== false,
      },
      status: 'INACTIVE', // Services start inactive
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.uid,
    };

    // Save to Firestore
    await db.collection('services').doc(serviceId).set(serviceData);

    // Create empty menuItems subcollection
    await db
      .collection('services')
      .doc(serviceId)
      .collection('menuItems')
      .doc('_init')
      .set({ initialized: true });

    logger.info('Service created successfully', { serviceId });

    return sendSuccess(res, {
      serviceId,
      status: 'INACTIVE',
      createdAt: serviceData.createdAt,
    }, 201);
  } catch (error: any) {
    logger.error('Failed to create service', error, { userId: req.user?.uid });
    return sendError(res, error);
  }
}

/**
 * Get all services (paginated)
 */
export async function getServices(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    logger.info('Fetching services', { page, limit });

    // Get total count
    const totalSnapshot = await db.collection('services').count().get();
    const total = totalSnapshot.data().count;

    // Get paginated results
    const snapshot = await db
      .collection('services')
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit)
      .get();

    const services = snapshot.docs.map((doc) => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      updatedAt: doc.data().updatedAt?.toDate?.(),
    }));

    return sendSuccess(res, {
      services,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    logger.error('Failed to fetch services', error);
    return sendError(res, error);
  }
}

/**
 * Get service by ID
 */
export async function getService(req: AuthRequest, res: Response) {
  try {
    const { serviceId } = req.params;

    logger.info('Fetching service details', { serviceId });

    const serviceDoc = await db.collection('services').doc(serviceId).get();

    if (!serviceDoc.exists) {
      return sendError(res, new Error('Service not found'));
    }

    // Get menu items
    const menuSnapshot = await db
      .collection('services')
      .doc(serviceId)
      .collection('menuItems')
      .get();

    const menuItems = menuSnapshot.docs.map((doc) => ({
      menuItemId: doc.id,
      ...doc.data(),
    }));

    const serviceData = serviceDoc.data();

    return sendSuccess(res, {
      ...serviceData,
      menuItems,
      createdAt: serviceData?.createdAt?.toDate?.(),
      updatedAt: serviceData?.updatedAt?.toDate?.(),
    });
  } catch (error: any) {
    logger.error('Failed to fetch service', error);
    return sendError(res, error);
  }
}

/**
 * Update service
 */
export async function updateService(req: AuthRequest, res: Response) {
  try {
    const { serviceId } = req.params;
    const updates = req.body;

    logger.info('Updating service', { serviceId });

    // Validate service exists
    const serviceDoc = await db.collection('services').doc(serviceId).get();
    if (!serviceDoc.exists) {
      return sendError(res, new Error('Service not found'));
    }

    // Update service
    await db
      .collection('services')
      .doc(serviceId)
      .update({
        ...updates,
        updatedAt: new Date(),
      });

    logger.info('Service updated successfully', { serviceId });

    return sendSuccess(res, {
      serviceId,
      updatedAt: new Date(),
    });
  } catch (error: any) {
    logger.error('Failed to update service', error);
    return sendError(res, error);
  }
}

/**
 * Toggle service status (ACTIVE/INACTIVE)
 */
export async function toggleServiceStatus(req: AuthRequest, res: Response) {
  try {
    const { serviceId } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return sendError(
        res,
        new ValidationError('Invalid status. Must be ACTIVE or INACTIVE')
      );
    }

    logger.info('Toggling service status', { serviceId, status });

    // Validate service exists
    const serviceDoc = await db.collection('services').doc(serviceId).get();
    if (!serviceDoc.exists) {
      return sendError(res, new Error('Service not found'));
    }

    // Update status
    await db
      .collection('services')
      .doc(serviceId)
      .update({
        status,
        updatedAt: new Date(),
      });

    logger.info('Service status updated', { serviceId, status });

    return sendSuccess(res, {
      serviceId,
      status,
      updatedAt: new Date(),
    });
  } catch (error: any) {
    logger.error('Failed to toggle service status', error);
    return sendError(res, error);
  }
}

/**
 * Add menu item to service
 */
export async function addMenuItem(req: AuthRequest, res: Response) {
  try {
    const { serviceId } = req.params;
    const { name, description, basePrice } = req.body;

    if (!name || !description || basePrice === undefined) {
      return sendError(
        res,
        new ValidationError('Missing required fields: name, description, basePrice')
      );
    }

    logger.info('Adding menu item', { serviceId, itemName: name });

    // Validate service exists
    const serviceDoc = await db.collection('services').doc(serviceId).get();
    if (!serviceDoc.exists) {
      return sendError(res, new Error('Service not found'));
    }

    // Generate menu item ID
    const menuItemId = uuidv4();

    // Add menu item
    await db
      .collection('services')
      .doc(serviceId)
      .collection('menuItems')
      .doc(menuItemId)
      .set({
        menuItemId,
        name,
        description,
        basePrice: parseFloat(basePrice),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    logger.info('Menu item added successfully', { serviceId, menuItemId });

    return sendSuccess(
      res,
      {
        menuItemId,
        serviceId,
        createdAt: new Date(),
      },
      201
    );
  } catch (error: any) {
    logger.error('Failed to add menu item', error);
    return sendError(res, error);
  }
}

/**
 * Update menu item
 */
export async function updateMenuItem(req: AuthRequest, res: Response) {
  try {
    const { serviceId, menuItemId } = req.params;
    const updates = req.body;

    logger.info('Updating menu item', { serviceId, menuItemId });

    // Validate menu item exists
    const menuDoc = await db
      .collection('services')
      .doc(serviceId)
      .collection('menuItems')
      .doc(menuItemId)
      .get();

    if (!menuDoc.exists) {
      return sendError(res, new Error('Menu item not found'));
    }

    // Update menu item
    await db
      .collection('services')
      .doc(serviceId)
      .collection('menuItems')
      .doc(menuItemId)
      .update({
        ...updates,
        updatedAt: new Date(),
      });

    logger.info('Menu item updated successfully', { serviceId, menuItemId });

    return sendSuccess(res, {
      menuItemId,
      updatedAt: new Date(),
    });
  } catch (error: any) {
    logger.error('Failed to update menu item', error);
    return sendError(res, error);
  }
}
