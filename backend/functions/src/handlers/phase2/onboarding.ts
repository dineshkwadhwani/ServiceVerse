import * as functions from 'firebase-functions';
import { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import { sendNotificationByEvent } from '@/utils/notificationCenter';
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

    const { email, phone, name } = req.body;

    if (!email || !phone || !name) {
      return sendError(res, new ValidationError('Missing required fields: name, email, phone'));
    }

    logger.info('Creating account manager', { phone, name, email });

    // Check if phone already exists in users collection
    const phoneCheck = await db
      .collection('users')
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (!phoneCheck.empty) {
      return sendError(res, new ValidationError('Phone number already registered'));
    }

    // Create Firebase Auth user with phone (no email auth - phone-only)
    const authUser = await auth.createUser({
      phoneNumber: `+91${phone}`,
      displayName: name,
    });

    logger.info('Created auth user for AM', { uid: authUser.uid, phone });

    // Create user document in users collection (verified and active immediately)
    const userData = {
      uid: authUser.uid,
      email,
      phone,
      name,
      role: 'ACCOUNT_MANAGER',
      status: 'ACTIVE',
      verified: true,
      verifiedMethod: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.uid,
    };

    await db.collection('users').doc(authUser.uid).set(userData);
    logger.info('Created user document for AM', { uid: authUser.uid });

    // Set custom claims
    await auth.setCustomUserClaims(authUser.uid, { role: 'ACCOUNT_MANAGER' });
    logger.info('Set custom claims for AM', { uid: authUser.uid });

    await sendNotificationByEvent('ACCOUNT_CREATED', {
      userId: authUser.uid,
      name,
      email,
      role: 'ACCOUNT_MANAGER',
    });

    return sendSuccess(
      res,
      {
        uid: authUser.uid,
        phone,
        name,
        email,
        role: 'ACCOUNT_MANAGER',
        status: 'ACTIVE',
        message: 'Account Manager created successfully. Ready to use.',
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

    // Query users collection for all ACCOUNT_MANAGER role users
    const snapshot = await db
      .collection('users')
      .where('role', '==', 'ACCOUNT_MANAGER')
      .get();

    const accountManagers = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      })
      .sort((a, b) => (b.createdAt as any) - (a.createdAt as any));

    logger.info(`Found ${accountManagers.length} account managers`);

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
 * This function is deprecated - use assignAccountManagerToSP instead
 */
export async function assignAccountManager(req: AuthRequest, res: Response) {
  try {
    const { spId } = req.params;
    const { accountManagerId } = req.body;

    logger.info('Assigning account manager (deprecated endpoint)', { spId, accountManagerId });

    // Verify AM exists in users collection
    const amDoc = await db.collection('users').doc(accountManagerId).get();
    if (!amDoc.exists) {
      return sendError(res, new ValidationError('Account Manager not found'));
    }

    const amData = amDoc.data() as any;
    if (amData.role !== 'ACCOUNT_MANAGER') {
      return sendError(res, new ValidationError('User is not an Account Manager'));
    }

    // Verify SP exists
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    // Update SP user document with nested AM object (single source of truth)
    await db.collection('users').doc(spId).update({
      accountManager: {
        userId: accountManagerId,
        name: amData.name,
        email: amData.email,
      },
      status: 'ASSIGNED',
      updatedAt: new Date(),
    });

    let serviceName = '';
    const serviceAssociations = await db
      .collection('users')
      .doc(spId)
      .collection('serviceAssociations')
      .limit(1)
      .get();
    if (!serviceAssociations.empty) {
      const serviceDoc = await db.collection('services').doc(serviceAssociations.docs[0].id).get();
      serviceName = serviceDoc.exists ? (serviceDoc.data() as any)?.name || '' : '';
    }

    await sendNotificationByEvent('SP_ASSIGNED_TO_AM', {
      spId,
      amId: accountManagerId,
      spName: spDoc.data()?.businessName || spDoc.data()?.name || spId,
      amName: amData.name || accountManagerId,
      serviceName,
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

    // Verify SP exists and is assigned (from users collection)
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    const spData = spDoc.data() as any;
    if (spData.role !== 'SERVICE_PROVIDER') {
      return sendError(res, new ValidationError('User is not a Service Provider'));
    }

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

    // Update SP user document with onboarding data
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

    await db.collection('users').doc(spId).update(updateData);

    // Create coworkers if provided (as separate user documents)
    if (coworkers && Array.isArray(coworkers)) {
      for (const coworker of coworkers) {

        // Create auth user for coworker
        try {
          const coworkerUser = await auth.createUser({
            email: coworker.email,
            phoneNumber: `+91${coworker.phone}`,
            displayName: coworker.name,
          });

          // Create user document for coworker
          await db.collection('users').doc(coworkerUser.uid).set({
            uid: coworkerUser.uid,
            name: coworker.name,
            phone: coworker.phone,
            email: coworker.email,
            role: 'COWORKER',
            serviceProviderId: spId,
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
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

    await sendNotificationByEvent('SP_ACTIVATION_COMPLETE', {
      spId,
      spName: businessName || ownerName || spId,
    });

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
 * Returns all SPs assigned to the authenticated AM from the users collection (single source of truth)
 */
export async function getServiceProviders(req: AuthRequest, res: Response) {
  try {
    const accountManagerId = req.user?.uid;

    if (!accountManagerId) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Fetching service providers', { accountManagerId });

    // Get all SPs assigned to this AM from users collection
    const snapshot = await db
      .collection('users')
      .where('role', '==', 'SERVICE_PROVIDER')
      .where('accountManager.userId', '==', accountManagerId)
      .get();

    const serviceProviders = snapshot.docs
      .map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.(),
        updatedAt: doc.data().updatedAt?.toDate?.(),
      } as any))
      .sort((a: any, b: any) => (b.createdAt || new Date()) - (a.createdAt || new Date()));

    return sendSuccess(res, {
      serviceProviders,
      total: serviceProviders.length,
      byStatus: {
        assigned: serviceProviders.filter((sp: any) => sp.status === 'ASSIGNED').length,
        active: serviceProviders.filter((sp: any) => sp.status === 'ACTIVE').length,
        pending: serviceProviders.filter((sp: any) => sp.status === 'PENDING').length,
        inactive: serviceProviders.filter((sp: any) => sp.status === 'INACTIVE').length,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch service providers', error);
    return sendError(res, error);
  }
}

/**
 * Update Account Manager
 */
export async function updateAccountManager(req: AuthRequest, res: Response) {
  try {
    const { amId } = req.params;
    const { name, email, phone, status } = req.body;

    if (!amId) {
      return sendError(res, new ValidationError('Account Manager ID is required'));
    }

    logger.info('Updating account manager', { amId, name, email, phone, status });

    const amRef = db.collection('users').doc(amId);
    const amSnap = await amRef.get();

    if (!amSnap.exists) {
      return sendError(res, new ValidationError('Account Manager not found'));
    }

    const currentAM = amSnap.data() as any;

    // Update Firestore document
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;
    if (email !== undefined && currentAM && email !== currentAM.email) {
      // Update Firebase Auth email
      await auth.updateUser(amId, { email });
      updateData.email = email;
    }

    await amRef.update(updateData);

    logger.info('Account Manager updated successfully', { amId });

    return sendSuccess(res, {
      amId,
      message: 'Account Manager updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update account manager', error);
    return sendError(res, error);
  }
}

/**
 * Get pending SP onboarding requests (SuperAdmin only)
 * SPs awaiting account manager assignment
 */
export async function getPendingOnboardingRequests(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.uid;
    console.log('[getPendingOnboardingRequests] Starting, userId:', userId);
    logger.info('Fetching pending SP onboarding requests', { userId });

    console.log('[getPendingOnboardingRequests] Querying approvals collection...');
    // Get all SP registration approvals
    const snapshot = await db
      .collection('approvals')
      .where('requestType', '==', 'SP_REGISTRATION')
      .get();

    console.log('[getPendingOnboardingRequests] Query successful, total docs:', snapshot.size);

    // Filter for PENDING_AM_ASSIGNMENT status
    const pendingRequests = snapshot.docs
      .filter((doc) => doc.data().status === 'PENDING_AM_ASSIGNMENT')
      .map((doc) => ({
        requestId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.(),
        updatedAt: doc.data().updatedAt?.toDate?.(),
      }))
      .sort((a, b) => (b.createdAt as any) - (a.createdAt as any));

    console.log('[getPendingOnboardingRequests] Filtered to', pendingRequests.length, 'pending requests');
    logger.info('Fetched pending onboarding requests', { count: pendingRequests.length });

    return sendSuccess(res, {
      requests: pendingRequests,
      total: pendingRequests.length,
    });
  } catch (error: any) {
    console.error('[getPendingOnboardingRequests] ERROR:', error.message, error.code);
    console.error('[getPendingOnboardingRequests] Full error:', error);
    logger.error('Failed to fetch pending onboarding requests', error);
    return sendError(res, error);
  }
}

/**
 * Assign Account Manager to SP (SuperAdmin only)
 * Updates the SP's user document with the AM reference as a nested object
 * Single source of truth: users collection only
 */
export async function assignAccountManagerToSP(req: AuthRequest, res: Response) {
  try {
    const { requestId } = req.params;
    const { accountManagerId } = req.body;

    if (!requestId || !accountManagerId) {
      return sendError(res, new ValidationError('Missing requestId or accountManagerId'));
    }

    logger.info('Assigning AM to SP', { requestId, accountManagerId });

    // Verify request exists
    const requestDoc = await db.collection('approvals').doc(requestId).get();
    if (!requestDoc.exists) {
      return sendError(res, new ValidationError('Approval request not found'));
    }

    const requestData = requestDoc.data() as any;
    const { userId, serviceId } = requestData;

    // Verify AM exists in users collection
    const amDoc = await db.collection('users').doc(accountManagerId).get();
    if (!amDoc.exists || amDoc.data()?.role !== 'ACCOUNT_MANAGER') {
      return sendError(res, new ValidationError('Account Manager not found'));
    }

    const amData = amDoc.data() as any;

    // Verify SP exists in users collection
    const spDoc = await db.collection('users').doc(userId).get();
    if (!spDoc.exists || spDoc.data()?.role !== 'SERVICE_PROVIDER') {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    // Update approval request with approver info
    await db.collection('approvals').doc(requestId).update({
      status: 'ASSIGNED',
      assignedAccountManagerId: accountManagerId,
      assignedAccountManagerName: amData.name,
      assignedAccountManagerEmail: amData.email,
      approverName: amData.name,
      approverPhone: amData.phone,
      assignedAt: new Date(),
      updatedAt: new Date(),
    });

    // Update SP user document with nested AM object (SINGLE SOURCE OF TRUTH)
    // This is the only place AM assignment should be stored
    await db.collection('users').doc(userId).update({
      accountManager: {
        userId: accountManagerId,
        name: amData.name,
        email: amData.email,
      },
      status: 'ASSIGNED',
      updatedAt: new Date(),
    });

    let serviceName = '';
    if (serviceId) {
      const serviceDoc = await db.collection('services').doc(serviceId).get();
      serviceName = serviceDoc.exists ? (serviceDoc.data() as any)?.name || '' : '';
    }

    await sendNotificationByEvent('SP_ASSIGNED_TO_AM', {
      spId: userId,
      amId: accountManagerId,
      spName: spDoc.data()?.businessName || spDoc.data()?.name || userId,
      amName: amData.name || accountManagerId,
      serviceName,
    });

    logger.info('Account manager assigned to SP (users collection only)', { requestId, accountManagerId, userId });

    return sendSuccess(res, {
      requestId,
      userId,
      status: 'ASSIGNED',
      assignedAccountManagerId: accountManagerId,
      assignedAt: new Date(),
    });
  } catch (error: any) {
    logger.error('Failed to assign account manager', error);
    return sendError(res, error);
  }
}

/**
 * Get pending SPs for Account Manager (AM assigned SPs awaiting onboarding)
 */
export async function getPendingSPsForAccountManager(req: AuthRequest, res: Response) {
  try {
    const accountManagerId = req.user?.uid;

    if (!accountManagerId) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Fetching pending SPs for AM', { accountManagerId });

    // Get approval requests assigned to this AM
    const snapshot = await db
      .collection('approvals')
      .where('assignedAccountManagerId', '==', accountManagerId)
      .where('requestType', '==', 'SP_REGISTRATION')
      .get();

    const requests = snapshot.docs
      .filter((doc) => doc.data().status !== 'COMPLETED')
      .map((doc) => ({
        requestId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.(),
        updatedAt: doc.data().updatedAt?.toDate?.(),
      } as any))
      .sort((a: any, b: any) => {
        // Sort by status first (ASSIGNED before IN_PROGRESS), then by date
        const statusOrder = { ASSIGNED: 1, IN_PROGRESS: 2 };
        const aStatus = (statusOrder as any)[a.status] || 3;
        const bStatus = (statusOrder as any)[b.status] || 3;
        if (aStatus !== bStatus) return aStatus - bStatus;
        return (b.createdAt as any) - (a.createdAt as any);
      });

    return sendSuccess(res, {
      requests,
      total: requests.length,
      byStatus: {
        assigned: requests.filter((r: any) => r.status === 'ASSIGNED').length,
        inProgress: requests.filter((r: any) => r.status === 'IN_PROGRESS').length,
        completed: requests.filter((r: any) => r.status === 'COMPLETED').length,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch pending SPs for AM', error);
    return sendError(res, error);
  }
}

/**
 * Mark SP onboarding as complete (AccountManager only)
 */
export async function markOnboardingComplete(req: AuthRequest, res: Response) {
  try {
    const { requestId } = req.params;
    const accountManagerId = req.user?.uid;

    if (!requestId) {
      return sendError(res, new ValidationError('requestId is required'));
    }

    if (!accountManagerId) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Marking onboarding as complete', { requestId, accountManagerId });

    // Verify request exists and is assigned to this AM
    const requestDoc = await db.collection('approvals').doc(requestId).get();
    if (!requestDoc.exists) {
      return sendError(res, new ValidationError('Approval request not found'));
    }

    const requestData = requestDoc.data() as any;
    if (requestData.assignedAccountManagerId !== accountManagerId) {
      return sendError(res, new ValidationError('You are not assigned to this SP'));
    }

    const { userId, serviceId } = requestData;

    // Update approval request
    await db.collection('approvals').doc(requestId).update({
      status: 'COMPLETED',
      completedAt: new Date(),
      updatedAt: new Date(),
    });

    // Update SP user document to ACTIVE status
    await db.collection('users').doc(userId).update({
      status: 'ACTIVE',
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    });

    // Update service association to ACTIVE
    await db
      .collection('users')
      .doc(userId)
      .collection('serviceAssociations')
      .doc(serviceId)
      .update({
        status: 'ACTIVE',
        isActive: true,
        activatedAt: new Date(),
      });

    logger.info('Onboarding marked as complete', { requestId, userId });

    return sendSuccess(res, {
      requestId,
      userId,
      status: 'COMPLETED',
      completedAt: new Date(),
    });
  } catch (error: any) {
    logger.error('Failed to mark onboarding as complete', error);
    return sendError(res, error);
  }
}
