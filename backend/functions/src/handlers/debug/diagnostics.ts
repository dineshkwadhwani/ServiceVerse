import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { sendError, sendSuccess, ValidationError } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';

const logger = new Logger('Diagnostics');

/**
 * Debug endpoint to check AM-SP assignments
 * GET /debug/check-sp-assignment?phone=9604188725
 */
export async function checkSPAssignment(req: AuthRequest, res: Response) {
  try {
    const { phone } = req.query;

    if (!phone) {
      return sendError(res, new ValidationError('Phone number required'));
    }

    logger.info('Checking SP assignment for phone', { phone });

    // Find AM by phone
    const amSnapshot = await db
      .collection('users')
      .where('phone', '==', phone as string)
      .where('role', '==', 'ACCOUNT_MANAGER')
      .get();

    if (amSnapshot.empty) {
      return sendError(res, new ValidationError('Account Manager not found with that phone'));
    }

    const amDoc = amSnapshot.docs[0];
    const amData = amDoc.data();
    const amId = amDoc.id;

    logger.info('Found AM', { amId, name: amData.name, phone: amData.phone });

    // Find all SPs assigned to this AM
    const spsSnapshot = await db
      .collection('serviceProviders')
      .where('accountManager.userId', '==', amId)
      .get();

    logger.info('Found SPs', { count: spsSnapshot.size, amId });

    // Get ALL SPs and check which ones have this AM assigned differently
    const allSPsSnapshot = await db.collection('serviceProviders').get();

    const spsWithThisAM = allSPsSnapshot.docs.filter(doc => {
      const data = doc.data() as any;
      return data.accountManager?.userId === amId;
    });

    const spsWithDifferentAM = allSPsSnapshot.docs.filter(doc => {
      const data = doc.data() as any;
      return data.accountManager?.userId && data.accountManager.userId !== amId;
    });

    const spsWithoutAM = allSPsSnapshot.docs.filter(doc => {
      const data = doc.data() as any;
      return !data.accountManager?.userId;
    });

    const spsList = spsSnapshot.docs.map(doc => ({
      spId: doc.id,
      businessName: (doc.data() as any).businessName,
      status: (doc.data() as any).status,
      accountManager: (doc.data() as any).accountManager,
      createdAt: (doc.data() as any).createdAt?.toDate?.() || (doc.data() as any).createdAt,
    }));

    return sendSuccess(res, {
      amInfo: {
        amId,
        name: amData.name,
        phone: amData.phone,
        email: amData.email,
        role: amData.role,
      },
      assignedSPs: {
        count: spsWithThisAM.length,
        list: spsList,
      },
      unassignedSPs: {
        count: spsWithoutAM.length,
        list: spsWithoutAM.slice(0, 5).map(doc => ({
          spId: doc.id,
          businessName: (doc.data() as any).businessName,
          status: (doc.data() as any).status,
        })),
      },
      spsWithDifferentAM: {
        count: spsWithDifferentAM.length,
        sample: spsWithDifferentAM.slice(0, 3).map(doc => ({
          spId: doc.id,
          businessName: (doc.data() as any).businessName,
          assignedTo: (doc.data() as any).accountManager?.name,
          assignedToId: (doc.data() as any).accountManager?.userId,
        })),
      },
      totalSPsInSystem: allSPsSnapshot.size,
    });
  } catch (error: any) {
    logger.error('Diagnostic check failed', error);
    return sendError(res, error);
  }
}
