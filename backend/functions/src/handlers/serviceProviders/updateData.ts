import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import { Response } from 'express';

const logger = new Logger('SPUpdateData');

/**
 * Consolidated endpoint for updating SP data
 * Role-based validation:
 * - SP (self): can update basicInfo, operations
 * - AM (assigned to SP): can update basicInfo, operations, documentation, commission, customMenus
 * - Status changes handled by separate endpoint (completeOnboarding)
 */
export async function updateSPData(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.uid;
    const userRole = req.user?.role;

    if (!userId) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { spId, basicInfo, operations, documentation, commission, customMenus } = req.body;

    if (!spId) {
      return sendError(res, new ValidationError('Service Provider ID is required'));
    }

    logger.info('Updating SP data', { spId, userId, userRole });

    // Verify SP exists
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    const spData = spDoc.data() as any;
    if (spData.role !== 'SERVICE_PROVIDER') {
      return sendError(res, new ValidationError('User is not a Service Provider'));
    }

    // Role-based validation
    if (userRole === 'SERVICE_PROVIDER') {
      // SP can only update their own profile (basicInfo, operations)
      if (userId !== spId) {
        return sendError(res, new ValidationError('Cannot update another user\'s profile'));
      }
      if (documentation || commission || customMenus) {
        return sendError(res, new ValidationError('Service Providers can only update basic info and operations'));
      }
    } else if (userRole === 'ACCOUNT_MANAGER') {
      // AM can update assigned SP's data (all fields)
      if (spData.accountManager?.userId !== userId) {
        return sendError(res, new ValidationError('This SP is not assigned to you'));
      }
      // AM can update all fields
    } else {
      return sendError(res, new ValidationError('Unauthorized to update SP data'));
    }

    // Build update object
    const updateData: any = { updatedAt: new Date() };

    // BasicInfo fields
    if (basicInfo) {
      updateData.email = basicInfo.email;
      updateData.businessName = basicInfo.name;
      updateData.ownerName = basicInfo.ownerName;
      updateData.address = basicInfo.address;
      updateData.area = basicInfo.area;
      updateData.city = basicInfo.city;
      updateData.pin = basicInfo.pinCode;
      updateData.businessLogo = basicInfo.logoUrl || null;
      updateData.basicInfo = {
        ...basicInfo,
        logoUrl: basicInfo.logoUrl || '',
      };
    }

    // Operations fields
    if (operations) {
      updateData.operations = operations;
    }

    // Documentation fields (AM only)
    if (documentation) {
      updateData.documentation = documentation;
    }

    // Commission fields (AM only)
    if (commission) {
      updateData.commission = commission;
    }

    // CustomMenus fields (AM only)
    if (customMenus) {
      updateData.customMenus = customMenus;
    }

    // Update Firestore document
    await db.collection('users').doc(spId).update(updateData);

    logger.info('SP data updated successfully', { spId, updatedBy: userId, role: userRole });

    return sendSuccess(res, {
      spId,
      message: 'SP data updated successfully',
      updatedFields: Object.keys(updateData).filter(k => k !== 'updatedAt'),
    });
  } catch (error: any) {
    logger.error('Failed to update SP data', error);
    return sendError(res, error);
  }
}
