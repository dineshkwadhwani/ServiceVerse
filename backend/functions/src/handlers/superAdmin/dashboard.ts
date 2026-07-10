import { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';

const logger = new Logger('SuperAdminDashboardHandlers');

/**
 * Get system statistics
 */
export async function getSystemStats(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Fetching system stats');

    // Count total users by role
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    const roleCount = {
      ACCOUNT_MANAGER: 0,
      SERVICE_PROVIDER: 0,
      CUSTOMER: 0,
      COWORKER: 0,
    };

    usersSnapshot.docs.forEach((doc) => {
      const role = doc.data().role;
      if (role in roleCount) {
        roleCount[role as keyof typeof roleCount]++;
      }
    });

    // Count total services
    const servicesSnapshot = await db.collection('services').get();
    const totalServices = servicesSnapshot.size;

    // Count total unorphan requests
    const unorphanSnapshot = await db.collection('unorphanRequests').get();

    return sendSuccess(res, {
      totalUsers,
      totalServices,
      totalAccountManagers: roleCount.ACCOUNT_MANAGER,
      totalServiceProviders: roleCount.SERVICE_PROVIDER,
      totalCustomers: roleCount.CUSTOMER,
    });
  } catch (error: any) {
    logger.error('Failed to fetch system stats', error);
    return sendError(res, error);
  }
}

/**
 * Get all users
 */
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Fetching all users');

    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();

    const users = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        verified: data.verified || false,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      };
    });

    return sendSuccess(res, { users });
  } catch (error: any) {
    logger.error('Failed to fetch users', error);
    return sendError(res, error);
  }
}

/**
 * Create a new user (Account Manager or Service Provider)
 */
export async function createUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { name, email, phone, role } = req.body;

    if (!name || !email || !role) {
      return sendError(res, new ValidationError('Name, email, and role are required'));
    }

    if (!['ACCOUNT_MANAGER', 'SERVICE_PROVIDER', 'CUSTOMER'].includes(role)) {
      return sendError(res, new ValidationError('Invalid role'));
    }

    logger.info('Creating new user', { name, email, role });

    // Check if email already exists
    const existingEmail = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingEmail.empty) {
      return sendError(res, new ValidationError('Email already in use'));
    }

    // Create Firebase Auth user with a temporary password
    const tempPassword = Math.random().toString(36).slice(-12);

    const authUser = await auth.createUser({
      email,
      password: tempPassword,
      displayName: name,
    });

    // Create user document in Firestore
    await db.collection('users').doc(authUser.uid).set({
      uid: authUser.uid,
      name,
      email,
      phone: phone || null,
      role,
      verified: false,
      verifiedMethod: null,
      isOrphaned: role === 'CUSTOMER' ? true : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.uid,
    });

    // Set custom claims
    await auth.setCustomUserClaims(authUser.uid, { role });

    logger.info('User created successfully', { uid: authUser.uid, role });

    // TODO: Send email with login credentials and password reset link

    return sendSuccess(res, {
      userId: authUser.uid,
      email,
      name,
      role,
      tempPassword: '***', // Don't return actual password
      message: `User created. Send them a password reset link to complete registration.`,
    });
  } catch (error: any) {
    logger.error('Failed to create user', error);
    return sendError(res, error);
  }
}
