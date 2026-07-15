import { Request, Response } from 'express';
import { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';

const logger = new Logger('CoworkerHandlers');

/**
 * Create a new coworker for a Service Provider
 * POST /service-providers/:spId/coworkers
 */
export async function createCoworker(req: AuthRequest, res: Response) {
  try {
    const { spId } = req.params;
    const { phone, name, status } = req.body;

    if (!spId || !phone || !name || !status) {
      return sendError(res, new ValidationError('Missing required fields: spId, phone, name, status'));
    }

    // Verify SP exists
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists || spDoc.data()?.role !== 'SERVICE_PROVIDER') {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    logger.info('Creating coworker for SP', { spId, phone, name });

    // Check if user with this phone already exists
    const existingUser = await db
      .collection('users')
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return sendError(res, new ValidationError('User with this phone number already exists'));
    }

    // Create Firebase Auth user with phone number
    let authUser;
    try {
      authUser = await auth.createUser({
        phoneNumber: `+91${phone}`,
        password: Math.random().toString(36).substring(2, 15), // Temporary password
      });
      logger.info('Auth user created for coworker', { uid: authUser.uid, phone });
    } catch (authError: any) {
      logger.error('Failed to create auth user', authError);
      return sendError(res, new ValidationError('Failed to create auth user for phone number'));
    }

    // Create user document for coworker
    const coworkerData = {
      uid: authUser.uid,
      phone,
      name,
      role: 'COWORKER',
      spId, // Associate with SP
      status, // ACTIVE or INACTIVE
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(authUser.uid).set(coworkerData);

    logger.info('Coworker created successfully', { uid: authUser.uid, spId });

    return sendSuccess(res, {
      coworkerId: authUser.uid,
      phone,
      name,
      status,
    }, 201);
  } catch (error: any) {
    logger.error('Failed to create coworker', error);
    return sendError(res, error);
  }
}

/**
 * Get all coworkers for a Service Provider
 * GET /service-providers/:spId/coworkers
 */
export async function getSPCoworkers(req: AuthRequest, res: Response) {
  try {
    const { spId } = req.params;

    if (!spId) {
      return sendError(res, new ValidationError('Service Provider ID is required'));
    }

    logger.info('Fetching coworkers for SP', { spId });

    // Query only by role to avoid composite index, then filter by spId in code
    const coworkersSnapshot = await db
      .collection('users')
      .where('role', '==', 'COWORKER')
      .get();

    const coworkers = coworkersSnapshot.docs
      .filter(doc => doc.data().spId === spId) // Filter in code to avoid composite index
      .map(doc => ({
        uid: doc.id,
        phone: doc.data().phone,
        name: doc.data().name,
        status: doc.data().status,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      }));

    logger.info('Coworkers fetched', { spId, count: coworkers.length });

    return sendSuccess(res, { coworkers });
  } catch (error: any) {
    logger.error('Failed to fetch coworkers', error);
    return sendError(res, error);
  }
}

/**
 * Update coworker status
 * PATCH /service-providers/:spId/coworkers/:coworkerId
 */
export async function updateCoworkerStatus(req: AuthRequest, res: Response) {
  try {
    const { spId, coworkerId } = req.params;
    const { status } = req.body;

    if (!spId || !coworkerId || !status) {
      return sendError(res, new ValidationError('Missing required fields'));
    }

    // Verify coworker belongs to this SP
    const coworkerDoc = await db.collection('users').doc(coworkerId).get();
    if (!coworkerDoc.exists || coworkerDoc.data()?.spId !== spId || coworkerDoc.data()?.role !== 'COWORKER') {
      return sendError(res, new ValidationError('Coworker not found or does not belong to this SP'));
    }

    await db.collection('users').doc(coworkerId).update({
      status,
      updatedAt: new Date(),
    });

    logger.info('Coworker status updated', { spId, coworkerId, status });

    return sendSuccess(res, { message: 'Coworker status updated successfully' });
  } catch (error: any) {
    logger.error('Failed to update coworker status', error);
    return sendError(res, error);
  }
}
