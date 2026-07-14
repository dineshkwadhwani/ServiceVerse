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
 * Get all customers associated with this SP
 * Includes both customers created by SP and customers associated by SP
 */
export async function getSPCustomers(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const spId = req.user.uid;

    logger.info('Fetching SP customers', { spId });

    const customers: any[] = [];
    const customerIds = new Set<string>();

    // 1. Fetch customers created by this SP
    const createdCustomersSnapshot = await db
      .collection('users')
      .where('createdBySP', '==', spId)
      .where('role', '==', 'CUSTOMER')
      .get();

    createdCustomersSnapshot.docs.forEach((doc) => {
      customerIds.add(doc.id);
      customers.push({
        customerId: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        phone: doc.data().phone,
        verified: doc.data().verified,
        addedAt: doc.data().createdAt,
      });
    });

    logger.info('Created customers fetched', { spId, count: createdCustomersSnapshot.docs.length });

    // 2. Fetch customers associated with this SP via serviceAssociations
    const allCustomersSnapshot = await db
      .collection('users')
      .where('role', '==', 'CUSTOMER')
      .get();

    for (const customerDoc of allCustomersSnapshot.docs) {
      const customerId = customerDoc.id;

      // Skip if already added (created by this SP)
      if (customerIds.has(customerId)) continue;

      // Check if this customer has an association with this SP
      const associationSnapshot = await customerDoc.ref
        .collection('serviceAssociations')
        .doc(spId)
        .get();

      if (associationSnapshot.exists) {
        customerIds.add(customerId);
        const assocData = associationSnapshot.data();
        customers.push({
          customerId,
          name: customerDoc.data().name,
          email: customerDoc.data().email,
          phone: customerDoc.data().phone,
          verified: customerDoc.data().verified,
          addedAt: assocData?.createdAt,
        });
      }
    }

    logger.info('SP customers fetched', { spId, count: customers.length, createdCount: createdCustomersSnapshot.docs.length });

    return sendSuccess(res, { customers });
  } catch (error: any) {
    logger.error('Failed to fetch SP customers', error);
    return sendError(res, error);
  }
}

/**
 * Get SP statistics (orders, revenue, rating, customer count)
 */
export async function getSPStats(req: AuthRequest, res: Response) {
  try {
    const spId = req.params.spId;
    if (!spId) {
      return sendError(res, new ValidationError('Service Provider ID is required'));
    }

    logger.info('Fetching SP stats', { spId });

    // Get SP data
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    const spData = spDoc.data() || {};

    // Calculate stats
    const stats = {
      totalOrders: spData.totalOrders || 0,
      totalRevenue: spData.totalRevenue || 0,
      averageRating: spData.averageRating || 0,
      totalCustomers: spData.totalCustomers || 0,
    };

    return sendSuccess(res, stats);
  } catch (error: any) {
    logger.error('Failed to fetch SP stats', error);
    return sendError(res, error);
  }
}

/**
 * Get SP earnings over time
 */
export async function getSPEarnings(req: AuthRequest, res: Response) {
  try {
    const spId = req.params.spId;
    if (!spId) {
      return sendError(res, new ValidationError('Service Provider ID is required'));
    }

    logger.info('Fetching SP earnings', { spId });

    // For now, return empty earnings array (can be expanded to aggregate orders by date)
    const earnings: any[] = [];

    return sendSuccess(res, { earnings });
  } catch (error: any) {
    logger.error('Failed to fetch SP earnings', error);
    return sendError(res, error);
  }
}
