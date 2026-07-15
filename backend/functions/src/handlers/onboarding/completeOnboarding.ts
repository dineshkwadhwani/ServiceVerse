import * as functions from 'firebase-functions';
import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import { sendNotificationByEvent } from '@/utils/notificationCenter';
import type { AuthRequest } from '@/middleware/auth';
import { Response } from 'express';

const logger = new Logger('OnboardingHandlers');

/**
 * Complete SP Onboarding (AccountManager only)
 * Saves all onboarding data to the SP's user document
 * Updates approval request status to COMPLETED
 */
export async function completeOnboarding(req: AuthRequest, res: Response) {
  try {
    const { spId } = req.params;
    const { basicInfo, operations, documentation, commission, customMenus, activation } = req.body;
    const accountManagerId = req.user?.uid;

    if (!spId) {
      return sendError(res, new ValidationError('Service Provider ID is required'));
    }

    if (!accountManagerId) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Completing SP onboarding', { spId, accountManagerId });

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

    // Validate all required data
    if (!basicInfo) {
      return sendError(res, new ValidationError('Basic information is required'));
    }

    if (!basicInfo.email || !basicInfo.name || !basicInfo.ownerName || !basicInfo.address || !basicInfo.area || !basicInfo.city || !basicInfo.pinCode) {
      return sendError(res, new ValidationError('All basic information fields are required'));
    }

    if (!operations) {
      return sendError(res, new ValidationError('Operations information is required'));
    }

    if (!operations.pickupAvailable && !operations.deliveryAvailable) {
      return sendError(res, new ValidationError('At least one service availability option is required'));
    }

    if (!documentation) {
      return sendError(res, new ValidationError('Documentation information is required'));
    }

    if (!documentation.gstNumber) {
      return sendError(res, new ValidationError('GST number is required'));
    }

    if (documentation.directPaymentAllowed && !documentation.qrCodeUrl) {
      return sendError(res, new ValidationError('QR code is required when direct payment is allowed'));
    }

    if (!commission || !commission.type) {
      return sendError(res, new ValidationError('Commission configuration is required'));
    }

    if (commission.type === 'PERCENTAGE' && !commission.value) {
      return sendError(res, new ValidationError('Commission percentage is required'));
    }

    if (!customMenus || Object.keys(customMenus).length === 0) {
      return sendError(res, new ValidationError('Menu items are required'));
    }

    // Validate at least one menu item is enabled
    const menuItems = Object.values(customMenus).flat() as any[];
    if (!menuItems.some((item) => item.isEnabled)) {
      return sendError(res, new ValidationError('At least one menu item must be selected'));
    }

    logger.info('Validation passed, updating SP document', { spId });

    // Determine final status based on activation
    let finalStatus = 'ONBOARDED';
    if (activation?.activateImmediately === true) {
      finalStatus = 'ACTIVE';
    }

    // Update SP user document with all onboarding data
    const updateData = {
      basicInfo,
      operations,
      documentation,
      commission,
      customMenus,
      status: finalStatus,
      onboardedAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(spId).update(updateData);
    logger.info('SP user document updated', { spId });

    // Find and update approval request
    try {
      const approvalsQuery = await db
        .collection('approvals')
        .where('userId', '==', spId)
        .where('requestType', '==', 'SP_REGISTRATION')
        .get();

      if (!approvalsQuery.empty) {
        const approvalDoc = approvalsQuery.docs[0];
        await approvalDoc.ref.update({
          status: 'COMPLETED',
          completedAt: new Date(),
          updatedAt: new Date(),
        });
        logger.info('Approval request updated to COMPLETED', { requestId: approvalDoc.id });
      }
    } catch (approvalError: any) {
      logger.warn('Failed to update approval request', { spId, error: approvalError.message });
      // Don't fail the whole operation if approval update fails
    }

    logger.info('SP onboarding completed successfully', { spId });

    if (activation?.activateImmediately === true) {
      await sendNotificationByEvent('SP_ACTIVATION_COMPLETE', {
        spId,
        spName: basicInfo?.name || spData?.businessName || spId,
      });
    } else {
      await sendNotificationByEvent('SP_ONBOARDING_COMPLETE', {
        spId,
      });
    }

    return sendSuccess(res, {
      spId,
      status: finalStatus,
      message: 'Onboarding completed successfully',
      onboardedAt: new Date(),
    });
  } catch (error: any) {
    logger.error('Failed to complete onboarding', error);
    return sendError(res, error);
  }
}
