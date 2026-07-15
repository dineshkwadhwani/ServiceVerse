import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import { sendNotificationByEvent } from '@/utils/notificationCenter';
import type { AuthRequest } from '@/middleware/auth';
import { Response } from 'express';

const logger = new Logger('SPActivationHandlers');

/**
 * Update SP activation status (AccountManager only)
 * Sets SP status to ACTIVE or back to ONBOARDED
 */
export async function updateSPActivationStatus(req: AuthRequest, res: Response) {
  try {
    const { spId } = req.params;
    const { activate } = req.body;
    const accountManagerId = req.user?.uid;

    if (!spId) {
      return sendError(res, new ValidationError('Service Provider ID is required'));
    }

    if (activate === undefined || activate === null) {
      return sendError(res, new ValidationError('Activate flag is required'));
    }

    if (!accountManagerId) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Updating SP activation status', { spId, activate, accountManagerId });

    // Validate SP exists and is assigned to this AM
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    const spData = spDoc.data() as any;
    if (spData.role !== 'SERVICE_PROVIDER') {
      return sendError(res, new ValidationError('User is not a Service Provider'));
    }

    if (spData.accountManager?.userId !== accountManagerId) {
      return sendError(res, new ValidationError('This SP is not assigned to you'));
    }

    // Only allow activation if status is ONBOARDED
    if (activate && spData.status !== 'ONBOARDED') {
      return sendError(res, new ValidationError('SP can only be activated from ONBOARDED status'));
    }

    // Only allow inactivation if status is ACTIVE or ONBOARDED
    if (!activate && !['ACTIVE', 'ONBOARDED'].includes(spData.status)) {
      return sendError(res, new ValidationError('SP cannot be inactivated from current status'));
    }

    // Update status
    const newStatus = activate ? 'ACTIVE' : 'ONBOARDED';
    await db.collection('users').doc(spId).update({
      status: newStatus,
      updatedAt: new Date(),
    });

    if (activate) {
      await sendNotificationByEvent('SP_ACTIVATION_COMPLETE', {
        spId,
        spName: spData.businessName || spData.name || spId,
      });
    }

    logger.info('SP activation status updated', { spId, newStatus });

    return sendSuccess(res, {
      spId,
      status: newStatus,
      message: `SP ${activate ? 'activated' : 'inactivated'} successfully`,
    });
  } catch (error: any) {
    logger.error('Failed to update SP activation status', error);
    return sendError(res, error);
  }
}
