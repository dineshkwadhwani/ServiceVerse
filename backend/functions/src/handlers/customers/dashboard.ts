import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import { sendNotificationByEvent } from '@/utils/notificationCenter';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('CustomerHandlers');

/**
 * Get all services a customer is associated with (including assigned provider info)
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
      .where('isActive', '==', true)
      .get();

    // Fetch service details and provider info for each association
    const services = [];
    for (const assocDoc of associationsSnapshot.docs) {
      const assocData = assocDoc.data();
      const serviceId = assocData.serviceId;
      const spId = assocData.spId;

      // Get service details
      const serviceDoc = await db.collection('services').doc(serviceId).get();
      if (!serviceDoc.exists) continue;

      const serviceData = serviceDoc.data() || {};

      // Get provider details if assigned
      let providerInfo = null;
      if (spId) {
        try {
          const spDoc = await db.collection('users').doc(spId).get();
          if (spDoc.exists) {
            const spData = spDoc.data() || {};
            providerInfo = {
              spId,
              businessName: spData.businessName || spData.name || 'Service Provider',
              ownerName: spData.ownerName || '',
              phone: spData.phone || '',
              email: spData.email || '',
              logo: spData.businessLogo || '',
            };
          }
        } catch (error) {
          logger.warn('Failed to fetch provider details', { spId, serviceId });
        }
      }

      services.push({
        serviceId,
        serviceName: serviceData.name || 'Unknown Service',
        logo: serviceData.logo || '',
        provider: providerInfo,
        associatedAt: assocData.associatedAt?.toDate?.() || new Date(),
      });
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
      .get();

    // Filter by business name matching query
    const providersCheck = await Promise.all(
      spSnapshot.docs.map(async (spDoc) => {
        const data = spDoc.data() || {};
        const normalizedStatus = String(data.status || '').toUpperCase();
        const isVisibleStatus = normalizedStatus === 'ACTIVE' || normalizedStatus === 'ASSIGNED';
        if (!isVisibleStatus) {
          return null;
        }

        const matchesQuery =
          data.businessName?.toLowerCase().includes((query as string).toLowerCase()) ||
          data.ownerName?.toLowerCase().includes((query as string).toLowerCase());
        if (!matchesQuery) {
          return null;
        }

        const serviceAssoc = await spDoc.ref.collection('serviceAssociations').doc(serviceId as string).get();
        if (!serviceAssoc.exists) {
          return null;
        }

        const serviceAssocData = serviceAssoc.data() || {};
        if (serviceAssocData.isActive === false) {
          return null;
        }

        return {
          spId: spDoc.id,
          businessName: data.businessName,
          ownerName: data.ownerName,
          email: data.email,
          phone: data.phone,
        };
      })
    );

    const providers = providersCheck.filter(Boolean);

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
      .get();

    const providersCheck = await Promise.all(
      spSnapshot.docs.map(async (spDoc) => {
        const serviceAssoc = await spDoc.ref
          .collection('serviceAssociations')
          .doc(serviceId as string)
          .get();

        const spData = spDoc.data() || {};
        const normalizedStatus = String(spData.status || '').toUpperCase();
        const isVisibleStatus = normalizedStatus === 'ACTIVE' || normalizedStatus === 'ASSIGNED';

        return {
          spDoc,
          supportsService:
            serviceAssoc.exists &&
            isVisibleStatus &&
            serviceAssoc.data()?.isActive !== false,
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
 * Public: list active service providers for a service, for the pre-login service
 * landing page. Only exposes business-facing info (no phone/email).
 */
export async function getPublicServiceProviders(req: AuthRequest, res: Response) {
  try {
    const { serviceId } = req.params;
    if (!serviceId) {
      return sendError(res, new ValidationError('serviceId is required'));
    }

    const spSnapshot = await db
      .collection('users')
      .where('role', '==', 'SERVICE_PROVIDER')
      .get();

    const providersCheck = await Promise.all(
      spSnapshot.docs.map(async (spDoc) => {
        const serviceAssoc = await spDoc.ref
          .collection('serviceAssociations')
          .doc(serviceId)
          .get();

        const spData = spDoc.data() || {};
        const normalizedStatus = String(spData.status || '').toUpperCase();
        const isVisibleStatus = normalizedStatus === 'ACTIVE' || normalizedStatus === 'ASSIGNED';

        return {
          spDoc,
          supportsService:
            serviceAssoc.exists &&
            isVisibleStatus &&
            serviceAssoc.data()?.isActive !== false,
        };
      })
    );

    const providers = providersCheck
      .filter((item) => item.supportsService)
      .map((item) => {
        const data = item.spDoc.data();
        return {
          spId: item.spDoc.id,
          businessName: data.businessName || data.name || 'Service Provider',
          city: data.city || '',
          area: data.area || '',
          logo: data.businessLogo || '',
        };
      });

    return sendSuccess(res, { providers });
  } catch (error: any) {
    logger.error('Failed to fetch public service providers', error);
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
