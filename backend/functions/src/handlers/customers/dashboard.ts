import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import { sendNotificationByEvent } from '@/utils/notificationCenter';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('CustomerHandlers');

/**
 * Get all services a customer is associated with
 */
export async function getCustomerServices(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Fetching customer services', { userId: req.user.uid });

    const associationsSnapshot = await db
      .collection('users')
      .doc(req.user.uid)
      .collection('serviceAssociations')
      .where('role', '==', 'CUSTOMER')
      .where('isActive', '==', true)
      .get();

    const serviceIds = associationsSnapshot.docs.map((doc) => doc.data().serviceId);

    if (serviceIds.length === 0) {
      return sendSuccess(res, { services: [] });
    }

    // Fetch service details for each service
    const services = [];
    for (const serviceId of serviceIds) {
      const serviceDoc = await db.collection('services').doc(serviceId).get();
      if (serviceDoc.exists) {
        services.push({
          serviceId: serviceDoc.id,
          ...serviceDoc.data(),
        });
      }
    }

    return sendSuccess(res, { services });
  } catch (error: any) {
    logger.error('Failed to fetch customer services', error);
    return sendError(res, error);
  }
}

/**
 * Search service providers for a specific service
 */
export async function searchServiceProviders(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { serviceId, query } = req.query;

    if (!serviceId || !query) {
      return sendError(res, new ValidationError('serviceId and query are required'));
    }

    logger.info('Searching service providers', { serviceId, query });

    // Get all service providers for this service
    const spSnapshot = await db
      .collection('users')
      .where('role', '==', 'SERVICE_PROVIDER')
      .where('status', '==', 'ACTIVE')
      .get();

    // Filter by business name matching query
    const providers = spSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return (
          data.businessName?.toLowerCase().includes((query as string).toLowerCase()) ||
          data.ownerName?.toLowerCase().includes((query as string).toLowerCase())
        );
      })
      .map((doc) => ({
        spId: doc.id,
        businessName: doc.data().businessName,
        ownerName: doc.data().ownerName,
        email: doc.data().email,
        phone: doc.data().phone,
      }));

    return sendSuccess(res, { providers });
  } catch (error: any) {
    logger.error('Failed to search service providers', error);
    return sendError(res, error);
  }
}

/**
 * Get service providers available for a service and the customer's associated SP (if any)
 */
export async function getCustomerServiceProviders(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { serviceId } = req.query;
    if (!serviceId) {
      return sendError(res, new ValidationError('serviceId is required'));
    }

    const customerId = req.user.uid;

    // Find current association for this service (if customer is already linked to an SP)
    let associatedSpId: string | null = null;
    const assocDoc = await db
      .collection('users')
      .doc(customerId)
      .collection('serviceAssociations')
      .doc(serviceId as string)
      .get();

    if (assocDoc.exists) {
      associatedSpId = assocDoc.data()?.spId || null;
    }

    // Find active SPs that provide this service
    const spSnapshot = await db
      .collection('users')
      .where('role', '==', 'SERVICE_PROVIDER')
      .where('status', '==', 'ACTIVE')
      .get();

    const providersCheck = await Promise.all(
      spSnapshot.docs.map(async (spDoc) => {
        const serviceAssoc = await spDoc.ref
          .collection('serviceAssociations')
          .doc(serviceId as string)
          .get();

        return {
          spDoc,
          supportsService: serviceAssoc.exists,
        };
      })
    );

    const providers = providersCheck
      .filter((item) => item.supportsService)
      .map((item) => ({
        spId: item.spDoc.id,
        businessName: item.spDoc.data().businessName || item.spDoc.data().name || 'Service Provider',
        ownerName: item.spDoc.data().ownerName || '',
        phone: item.spDoc.data().phone || '',
        city: item.spDoc.data().city || '',
        area: item.spDoc.data().area || '',
      }));

    return sendSuccess(res, {
      providers,
      associatedSpId,
    });
  } catch (error: any) {
    logger.error('Failed to fetch customer service providers', error);
    return sendError(res, error);
  }
}

/**
 * Add a service provider to customer's list
 */
export async function addServiceProviderToCustomer(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { serviceId, spId } = req.body;

    if (!serviceId || !spId) {
      return sendError(res, new ValidationError('serviceId and spId are required'));
    }

    logger.info('Adding service provider to customer', {
      customerId: req.user.uid,
      serviceId,
      spId,
    });

    // Check if already added
    const existingAssociation = await db
      .collection('users')
      .doc(req.user.uid)
      .collection('serviceProviders')
      .doc(spId)
      .get();

    if (existingAssociation.exists) {
      return sendError(res, new ValidationError('Service provider already added'));
    }

    // Create association
    await db
      .collection('users')
      .doc(req.user.uid)
      .collection('serviceProviders')
      .doc(spId)
      .set({
        spId,
        serviceId,
        addedAt: new Date(),
      });

    logger.info('Service provider added to customer');

    return sendSuccess(res, {
      message: 'Service provider added successfully',
    });
  } catch (error: any) {
    logger.error('Failed to add service provider', error);
    return sendError(res, error);
  }
}

/**
 * Request to unorphan customer account
 */
export async function requestUnorphan(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { serviceId, reason } = req.body;

    if (!serviceId || !reason) {
      return sendError(res, new ValidationError('serviceId and reason are required'));
    }

    logger.info('Creating unorphan request', {
      customerId: req.user.uid,
      serviceId,
      reason,
    });

    const customerDoc = await db.collection('users').doc(req.user.uid).get();
    const customerData = customerDoc.data() || {};

    const assocDoc = await db
      .collection('users')
      .doc(req.user.uid)
      .collection('serviceAssociations')
      .doc(serviceId)
      .get();

    const currentSPId = assocDoc.exists ? assocDoc.data()?.spId || null : null;
    let accountManagerId: string | null = null;

    if (currentSPId) {
      const spDoc = await db.collection('users').doc(currentSPId).get();
      accountManagerId = spDoc.data()?.accountManager?.userId || null;
    }

    // Create unorphan request
    const requestId = uuidv4();
    const request = {
      requestId,
      customerId: req.user.uid,
      serviceId,
      currentSPId,
      accountManagerId,
      reason,
      status: 'PENDING',
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('unorphanRequests').doc(requestId).set(request);

    await sendNotificationByEvent('DEASSOCIATION_REQUESTED', {
      requestId,
      customerId: req.user.uid,
      customerName: customerData?.name || 'Customer',
      customerEmail: customerData?.email || '',
      reason,
      amId: accountManagerId,
    });

    logger.info('Unorphan request created', { requestId });

    return sendSuccess(res, {
      requestId,
      message: 'Unorphan request submitted. Account Manager will review.',
    }, 201);
  } catch (error: any) {
    logger.error('Failed to create unorphan request', error);
    return sendError(res, error);
  }
}
