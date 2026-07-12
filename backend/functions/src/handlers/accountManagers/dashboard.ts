import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';

const logger = new Logger('AMDashboardHandlers');

/**
 * Get Account Manager dashboard stats
 */
export async function getAMStats(req: any, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const amId = req.user.uid;
    logger.info('Fetching AM stats', { amId });

    // Get assigned SPs
    const spsSnapshot = await db
      .collection('serviceProviders')
      .where('accountManager.userId', '==', amId)
      .get();

    const totalSPs = spsSnapshot.size;
    const activeSPs = spsSnapshot.docs.filter((doc) => doc.data().status === 'ACTIVE').length;
    const pendingSPs = spsSnapshot.docs.filter((doc) => doc.data().status === 'ONBOARDING').length;

    // Get pending onboarding requests
    const approvalsSnapshot = await db
      .collection('approvals')
      .where('requestType', '==', 'SP_REGISTRATION')
      .where('status', '==', 'PENDING_AM_ASSIGNMENT')
      .where('assignedToAM', '==', amId)
      .get();

    const pendingApprovals = approvalsSnapshot.size;

    return sendSuccess(res, {
      totalSPs,
      activeSPs,
      pendingSPs,
      inactiveSPs: totalSPs - activeSPs - pendingSPs,
      pendingApprovals,
    });
  } catch (error: any) {
    logger.error('Failed to fetch AM stats', error);
    return sendError(res, error);
  }
}

/**
 * Get pending onboarding requests for this AM
 */
export async function getAMPendingOnboarding(req: any, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const amId = req.user.uid;
    logger.info('Fetching pending onboarding for AM', { amId });

    // Get pending SP registrations assigned to this AM
    const snapshot = await db
      .collection('approvals')
      .where('requestType', '==', 'SP_REGISTRATION')
      .where('status', '==', 'PENDING_AM_ASSIGNMENT')
      .where('assignedToAM', '==', amId)
      .get();

    const requests = snapshot.docs.map((doc) => ({
      requestId: doc.id,
      spName: doc.data().spName,
      city: doc.data().city,
      status: doc.data().status,
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      assignedAt: doc.data().assignedAt?.toDate?.() || doc.data().assignedAt,
    }));

    return sendSuccess(res, {
      requests,
      total: requests.length,
    });
  } catch (error: any) {
    logger.error('Failed to fetch pending onboarding', error);
    return sendError(res, error);
  }
}

/**
 * Get all unorphan requests for this AM
 */
export async function getUnorphanRequests(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Fetching unorphan requests for AM', { amId: req.user.uid });

    const requestsSnapshot = await db
      .collection('unorphanRequests')
      .orderBy('requestedAt', 'desc')
      .get();

    const requests = await Promise.all(
      requestsSnapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Get customer details
        const customerDoc = await db.collection('users').doc(data.customerId).get();
        const customerData = customerDoc.data();

        // Get service details
        const serviceDoc = await db.collection('services').doc(data.serviceId).get();
        const serviceData = serviceDoc.data();

        // Get SP details if non-orphaned
        let spName = null;
        if (data.currentSPId) {
          const spDoc = await db.collection('users').doc(data.currentSPId).get();
          spName = spDoc.data()?.businessName || spDoc.data()?.name;
        }

        return {
          requestId: doc.id,
          customerId: data.customerId,
          customerName: customerData?.name,
          customerEmail: customerData?.email,
          customerPhone: customerData?.phone,
          serviceId: data.serviceId,
          serviceName: serviceData?.name,
          currentSPId: data.currentSPId,
          spName,
          reason: data.reason,
          status: data.status,
          requestedAt: data.requestedAt.toDate ? data.requestedAt.toDate() : data.requestedAt,
          reviewedBy: data.reviewedBy,
          reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
          approvalNotes: data.approvalNotes,
        };
      })
    );

    return sendSuccess(res, { requests });
  } catch (error: any) {
    logger.error('Failed to fetch unorphan requests', error);
    return sendError(res, error);
  }
}

/**
 * Approve or reject an unorphan request
 */
export async function reviewUnorphanRequest(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { requestId } = req.params;
    const { status, approvalNotes } = req.body;

    if (!requestId || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return sendError(res, new ValidationError('Invalid request or status'));
    }

    logger.info('Reviewing unorphan request', {
      requestId,
      status,
      amId: req.user.uid,
    });

    const requestDoc = await db.collection('unorphanRequests').doc(requestId).get();

    if (!requestDoc.exists) {
      return sendError(res, new ValidationError('Request not found'));
    }

    const requestData = requestDoc.data() as any;

    if (!requestData || requestData.status !== 'PENDING') {
      return sendError(res, new ValidationError('Request not found or already reviewed'));
    }

    // Update unorphan request with review details
    await db.collection('unorphanRequests').doc(requestId).update({
      status,
      reviewedBy: req.user.uid,
      reviewedAt: new Date(),
      approvalNotes: approvalNotes || '',
    });

    // If approved, update customer to orphaned
    if (status === 'APPROVED') {
      await db.collection('users').doc(requestData.customerId).update({
        isOrphaned: true,
        orphanedAt: new Date(),
      });

      logger.info('Customer unorphaned', { customerId: requestData.customerId });
    }

    return sendSuccess(res, {
      requestId,
      status,
      message: status === 'APPROVED' ? 'Request approved' : 'Request rejected',
    });
  } catch (error: any) {
    logger.error('Failed to review unorphan request', error);
    return sendError(res, error);
  }
}
