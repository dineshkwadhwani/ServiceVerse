import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import { Response } from 'express';

const logger = new Logger('SPProfileUpdate');

/**
 * Update SP's own profile (BasicInfo + Operations only)
 * Service Providers can always update their basic info and operations
 * regardless of onboarding status
 */
export async function updateSPProfile(req: AuthRequest, res: Response) {
  try {
    const spId = req.user?.uid;

    if (!spId) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { basicInfo, operations } = req.body;

    if (!basicInfo || !operations) {
      return sendError(res, new ValidationError('BasicInfo and Operations are required'));
    }

    logger.info('Updating SP profile', { spId });

    // Verify user is a SERVICE_PROVIDER
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    const spData = spDoc.data() as any;
    if (spData.role !== 'SERVICE_PROVIDER') {
      return sendError(res, new ValidationError('User is not a Service Provider'));
    }

    // Update only basicInfo and operations
    const updateData = {
      email: basicInfo.email,
      businessName: basicInfo.name,
      ownerName: basicInfo.ownerName,
      address: basicInfo.address,
      area: basicInfo.area,
      city: basicInfo.city,
      pin: basicInfo.pinCode,
      businessLogo: basicInfo.logoUrl || null,
      basicInfo: {
        ...basicInfo,
        logoUrl: basicInfo.logoUrl || '',
      },
      operations,
      updatedAt: new Date(),
    };

    await db.collection('users').doc(spId).update(updateData);

    logger.info('SP profile updated successfully', { spId });

    return sendSuccess(res, {
      spId,
      message: 'Profile updated successfully',
      updatedFields: ['basicInfo', 'operations'],
    });
  } catch (error: any) {
    logger.error('Failed to update SP profile', error);
    return sendError(res, error);
  }
}
