import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import { Response } from 'express';

const logger = new Logger('SPProfileHandler');

/**
 * Get complete SP profile (for onboarding stepper)
 * Returns all SP data including operations, documentation, commission, etc.
 */
export async function getSPProfile(req: AuthRequest, res: Response) {
  try {
    const { spId } = req.params;

    if (!spId) {
      return sendError(res, new ValidationError('Service Provider ID is required'));
    }

    logger.info('Fetching SP profile', { spId });

    // Get SP user document
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    const spData = spDoc.data() as any;
    if (spData.role !== 'SERVICE_PROVIDER') {
      return sendError(res, new ValidationError('User is not a Service Provider'));
    }

    // Get service ID from serviceAssociations subcollection
    let serviceId = null;
    let serviceName = null;
    const serviceAssocs = await db
      .collection('users')
      .doc(spId)
      .collection('serviceAssociations')
      .limit(1)
      .get();

    if (serviceAssocs.docs.length > 0) {
      serviceId = serviceAssocs.docs[0]?.id;
      // Try to get service name
      try {
        const serviceDoc = await db.collection('services').doc(serviceId).get();
        if (serviceDoc.exists) {
          serviceName = serviceDoc.data()?.name || serviceName;
        }
      } catch (error) {
        logger.warn('Failed to fetch service details', { serviceId, error: String(error) });
      }
    }

    // Get configured menu if available
    let customMenus = null;
    if (serviceId && spData.customMenus?.[serviceId]) {
      customMenus = spData.customMenus[serviceId];
    }

    const profileData = {
      uid: spId,
      ...spData,
      // Flatten the profile data with all fields
      businessName: spData.businessName || '',
      ownerName: spData.ownerName || '',
      email: spData.email || '',
      phone: spData.phone || '',
      address: spData.address || '',
      area: spData.area || '',
      city: spData.city || '',
      pin: spData.pin || '',
      // Onboarding fields
      basicInfo: {
        email: spData.basicInfo?.email || spData.email || '',
        name: spData.basicInfo?.name || spData.businessName || '',
        ownerName: spData.basicInfo?.ownerName || spData.ownerName || '',
        address: spData.basicInfo?.address || spData.address || '',
        area: spData.basicInfo?.area || spData.area || '',
        city: spData.basicInfo?.city || spData.city || '',
        pinCode: spData.basicInfo?.pinCode || spData.pin || '',
        logoUrl: spData.basicInfo?.logoUrl || spData.businessLogo || '',
      },
      operations: spData.operations || {
        workingHours: {
          monday: { open: false },
          tuesday: { open: false },
          wednesday: { open: false },
          thursday: { open: false },
          friday: { open: false },
          saturday: { open: false },
          sunday: { open: false },
        },
        pickupAvailable: false,
        deliveryAvailable: false,
      },
      documentation: spData.documentation || {
        gstNumber: '',
        gstCollectionMandatory: false,
        directPaymentAllowed: false,
      },
      commission: spData.commission || {
        type: 'PERCENTAGE',
        value: 0,
      },
      customMenus: spData.customMenus || {},
      service: serviceId ? {
        serviceId,
        serviceName: serviceName || serviceId
      } : undefined,
      // Status and dates
      status: spData.status || 'ASSIGNED',
      createdAt: spData.createdAt?.toDate?.() || spData.createdAt,
      updatedAt: spData.updatedAt?.toDate?.() || spData.updatedAt,
    };

    return sendSuccess(res, profileData);
  } catch (error: any) {
    logger.error('Failed to fetch SP profile', error);
    return sendError(res, error);
  }
}
