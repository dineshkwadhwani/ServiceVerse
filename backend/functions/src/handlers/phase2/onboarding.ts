import * as functions from 'firebase-functions';
import { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('Phase2Handlers');

/**
 * Create Account Manager (SuperAdmin only)
 */
export async function createAccountManager(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { email, phone, name, serviceId } = req.body;

    if (!email || !phone || !name || !serviceId) {
      return sendError(res, new ValidationError('Missing required fields'));
    }

    logger.info('Creating account manager', { email, serviceId });

    // Check if service exists
    const serviceDoc = await db.collection('services').doc(serviceId).get();
    if (!serviceDoc.exists) {
      return sendError(res, new ValidationError('Service not found'));
    }

    // Create auth user
    const userRecord = await auth.createUser({
      email,
      password: Math.random().toString(36).slice(-12), // Temporary password
      displayName: name,
      phoneNumber: `+91${phone}`,
    });

    // Create Firestore document
    const amData = {
      uid: userRecord.uid,
      email,
      phone,
      name,
      role: 'ACCOUNT_MANAGER',
      service: {
        serviceId,
        serviceName: serviceDoc.data()?.name,
      },
      managerId: null, // For future hierarchy
      status: 'ACTIVE',
      createdAt: new Date(),
      createdBy: req.user.uid,
    };

    await db.collection('accountManagers').doc(userRecord.uid).set(amData);

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'ACCOUNT_MANAGER',
      serviceId,
    });

    logger.info('Account Manager created successfully', { uid: userRecord.uid });

    return sendSuccess(
      res,
      {
        uid: userRecord.uid,
        email,
        name,
        status: 'ACTIVE',
        temporaryPassword: 'Email sent to user',
      },
      201
    );
  } catch (error: any) {
    logger.error('Failed to create account manager', error);
    return sendError(res, error);
  }
}

/**
 * Get all Account Managers
 */
export async function getAccountManagers(req: AuthRequest, res: Response) {
  try {
    logger.info('Fetching account managers');

    const snapshot = await db.collection('accountManagers').orderBy('createdAt', 'desc').get();

    const accountManagers = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
    }));

    return sendSuccess(res, {
      accountManagers,
      total: accountManagers.length,
    });
  } catch (error: any) {
    logger.error('Failed to fetch account managers', error);
    return sendError(res, error);
  }
}

/**
 * Assign ServiceProvider to AccountManager (SuperAdmin)
 */
export async function assignAccountManager(req: AuthRequest, res: Response) {
  try {
    const { spId } = req.params;
    const { accountManagerId } = req.body;

    logger.info('Assigning account manager', { spId, accountManagerId });

    // Verify AM exists
    const amDoc = await db.collection('accountManagers').doc(accountManagerId).get();
    if (!amDoc.exists) {
      return sendError(res, new ValidationError('Account Manager not found'));
    }

    // Update SP document
    await db.collection('serviceProviders').doc(spId).update({
      accountManager: {
        userId: accountManagerId,
        name: amDoc.data()?.name,
        email: amDoc.data()?.email,
      },
      status: 'ASSIGNED',
      updatedAt: new Date(),
    });

    logger.info('Account manager assigned successfully', { spId });

    return sendSuccess(res, {
      spId,
      status: 'ASSIGNED',
      assignedAt: new Date(),
    });
  } catch (error: any) {
    logger.error('Failed to assign account manager', error);
    return sendError(res, error);
  }
}

/**
 * Onboard ServiceProvider (AccountManager)
 */
export async function onboardServiceProvider(req: AuthRequest, res: Response) {
  try {
    const { spId } = req.params;
    const {
      businessName,
      businessAddress,
      businessPhone,
      ownerName,
      gstNumber,
      bankAccountDetails,
      businessLogo,
      workingHours,
      commission,
      coworkers,
    } = req.body;

    logger.info('Onboarding service provider', { spId });

    // Verify SP exists and is assigned
    const spDoc = await db.collection('serviceProviders').doc(spId).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    const spData = spDoc.data();
    if (spData?.status !== 'ASSIGNED') {
      return sendError(
        res,
        new ValidationError(
          'Service Provider must be in ASSIGNED status to onboard'
        )
      );
    }

    // TODO: Handle file uploads (logo, GST certificate)
    // For now, use placeholders
    const logoUrl = 'https://via.placeholder.com/200?text=Logo';

    // Update SP with onboarding data
    const updateData = {
      businessName,
      businessAddress,
      businessPhone,
      ownerName,
      gstNumber: gstNumber || null,
      bankAccountDetails,
      businessLogo: logoUrl,
      workingHours,
      commission: {
        type: commission.type,
        value: parseFloat(commission.value),
        active: commission.active !== false,
      },
      status: 'ACTIVE',
      onboardedAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('serviceProviders').doc(spId).update(updateData);

    // Create coworkers if provided
    if (coworkers && Array.isArray(coworkers)) {
      for (const coworker of coworkers) {
        const coworkerId = uuidv4();

        // Create auth user for coworker
        try {
          const coworkerUser = await auth.createUser({
            email: coworker.email,
            password: Math.random().toString(36).slice(-12),
            displayName: coworker.name,
            phoneNumber: `+91${coworker.phone}`,
          });

          // Create Firestore document
          await db
            .collection('serviceProviders')
            .doc(spId)
            .collection('coworkers')
            .doc(coworkerUser.uid)
            .set({
              uid: coworkerUser.uid,
              name: coworker.name,
              phone: coworker.phone,
              email: coworker.email,
              role: 'COWORKER',
              status: 'ACTIVE',
              createdAt: new Date(),
            });

          // Set custom claims
          await auth.setCustomUserClaims(coworkerUser.uid, {
            role: 'COWORKER',
            serviceProviderId: spId,
          });
        } catch (coworkerError) {
          logger.warn('Failed to create coworker', { error: String(coworkerError) });
        }
      }
    }

    logger.info('Service provider onboarded successfully', { spId });

    return sendSuccess(res, {
      spId,
      status: 'ACTIVE',
      onboardedAt: new Date(),
      businessName,
    });
  } catch (error: any) {
    logger.error('Failed to onboard service provider', error);
    return sendError(res, error);
  }
}

/**
 * Get ServiceProviders for AccountManager
 */
export async function getServiceProviders(req: AuthRequest, res: Response) {
  try {
    const accountManagerId = req.user?.uid;

    if (!accountManagerId) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Fetching service providers', { accountManagerId });

    // Get all SPs assigned to this AM
    const snapshot = await db
      .collection('serviceProviders')
      .where('accountManager.userId', '==', accountManagerId)
      .orderBy('createdAt', 'desc')
      .get();

    const serviceProviders = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      onboardedAt: doc.data().onboardedAt?.toDate?.(),
    } as any));

    return sendSuccess(res, {
      serviceProviders,
      total: serviceProviders.length,
      byStatus: {
        active: serviceProviders.filter((sp: any) => sp.status === 'ACTIVE').length,
        pending: serviceProviders.filter((sp: any) => sp.status === 'ONBOARDING').length,
        inactive: serviceProviders.filter((sp: any) => sp.status === 'INACTIVE').length,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch service providers', error);
    return sendError(res, error);
  }
}
