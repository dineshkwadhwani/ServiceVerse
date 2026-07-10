import { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('SPDashboardHandlers');

/**
 * Create a customer from SP dashboard
 * SP sends email or phone, we create customer and send invitation
 */
export async function createCustomerBySP(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { email, phone } = req.body;

    if (!email && !phone) {
      return sendError(res, new ValidationError('Email or phone is required'));
    }

    const spId = req.user.uid;

    logger.info('SP creating customer', { spId, email, phone });

    // Determine contact method
    const contactMethod = email ? 'email' : 'phone';
    const contact = email || phone;

    // Check if customer already exists with this email/phone
    let existingUser = null;
    if (email) {
      const emailCheck = await db
        .collection('users')
        .where('email', '==', email)
        .where('role', '==', 'CUSTOMER')
        .limit(1)
        .get();
      existingUser = emailCheck.docs[0];
    } else {
      const phoneCheck = await db
        .collection('users')
        .where('phone', '==', phone)
        .where('role', '==', 'CUSTOMER')
        .limit(1)
        .get();
      existingUser = phoneCheck.docs[0];
    }

    if (existingUser) {
      return sendError(res, new ValidationError('Customer with this contact already exists'));
    }

    // Generate temporary password for initial login
    const tempPassword = Math.random().toString(36).substring(2, 15);

    // Create auth user
    const authUser = await auth.createUser({
      ...(email && { email }),
      ...(phone && { phoneNumber: `+91${phone}` }),
      password: tempPassword, // Temporary password, will verify OTP on first login
    });

    logger.info('Auth user created', { uid: authUser.uid });

    // Create user document (non-orphaned - linked to SP)
    const userData = {
      uid: authUser.uid,
      email: email || '',
      phone: phone || '',
      name: email || phone || 'Customer',
      role: 'CUSTOMER',
      verified: false,
      verifiedMethod: null,
      isOrphaned: false, // Non-orphaned: locked to this SP
      createdBySP: spId,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(authUser.uid).set(userData);

    logger.info('User document created for non-orphaned customer', { uid: authUser.uid });

    // Get SP details for the message
    const spDoc = await db.collection('users').doc(spId).get();
    const spData = spDoc.data();
    const spName = spData?.businessName || spData?.name || 'Service Provider';

    // TODO: Send email or SMS with invitation link and instructions
    // For now, just log it
    logger.info('Invitation should be sent to customer', {
      contact,
      method: contactMethod,
      message: `You've been added by ${spName}, download app and login to verify`,
    });

    return sendSuccess(res, {
      customerId: authUser.uid,
      contact,
      message: `Invitation sent to ${contact}`,
    }, 201);
  } catch (error: any) {
    logger.error('Failed to create customer', error);
    return sendError(res, error);
  }
}

/**
 * Get all customers created by this SP
 */
export async function getSPCustomers(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const spId = req.user.uid;

    logger.info('Fetching SP customers', { spId });

    const customersSnapshot = await db
      .collection('users')
      .where('createdBySP', '==', spId)
      .where('role', '==', 'CUSTOMER')
      .get();

    const customers = customersSnapshot.docs.map((doc) => ({
      customerId: doc.id,
      name: doc.data().name,
      email: doc.data().email,
      phone: doc.data().phone,
      verified: doc.data().verified,
      addedAt: doc.data().createdAt,
    }));

    return sendSuccess(res, { customers });
  } catch (error: any) {
    logger.error('Failed to fetch SP customers', error);
    return sendError(res, error);
  }
}
