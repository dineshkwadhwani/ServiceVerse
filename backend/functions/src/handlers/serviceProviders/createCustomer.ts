import { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';

const logger = new Logger('CreateCustomerHandler');

/**
 * Validate phone number format (10 digits, digits only)
 */
function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Step 1: Search for customer by phone
 * Returns:
 * - { status: 'NOT_EXISTS' } - customer doesn't exist
 * - { status: 'ASSOCIATED_OTHER_SP', message: '...' } - already associated with another SP for same service
 * - { status: 'EXISTS_ORPHANED', customer: {...} } - exists but orphaned for this service
 */
export async function searchCustomerByPhone(req: AuthRequest, res: Response) {
  try {
    const { phone } = req.body;

    if (!phone || !validatePhoneNumber(phone)) {
      return sendError(res, new ValidationError('Valid 10-digit phone number is required'));
    }

    const spId = req.user?.uid;
    if (!spId) {
      return sendError(res, new ValidationError('Service Provider not authenticated'));
    }

    logger.info('Searching customer by phone', { phone, spId });

    // Get SP's service ID
    const spServiceAssoc = await db
      .collection('users')
      .doc(spId)
      .collection('serviceAssociations')
      .limit(1)
      .get();

    if (spServiceAssoc.empty) {
      return sendError(res, new ValidationError('Service Provider has no assigned service'));
    }

    const serviceId = spServiceAssoc.docs[0].id;
    logger.info('SP service ID found', { spId, serviceId });

    // Check if customer exists by phone
    const customerQuery = await db
      .collection('users')
      .where('phone', '==', phone)
      .where('role', '==', 'CUSTOMER')
      .limit(1)
      .get();

    if (customerQuery.empty) {
      // Customer doesn't exist
      return sendSuccess(res, { status: 'NOT_EXISTS' });
    }

    const customerDoc = customerQuery.docs[0];
    const customerId = customerDoc.id;
    const customerData = customerDoc.data();

    logger.info('Customer found', { customerId, phone });

    // Check if customer is already associated with another SP for the same service
    const existingAssoc = await db
      .collection('users')
      .doc(customerId)
      .collection('serviceAssociations')
      .doc(serviceId)
      .get();

    if (existingAssoc.exists) {
      const assocData = existingAssoc.data();
      if (assocData?.spId && assocData.spId !== spId) {
        // Already associated with a different SP
        return sendSuccess(res, {
          status: 'ASSOCIATED_OTHER_SP',
          message: 'Customer already exists and is already associated with another Service Provider',
        });
      } else if (assocData?.spId === spId) {
        // Already associated with this SP
        return sendSuccess(res, {
          status: 'ASSOCIATED_SAME_SP',
          message: 'Customer is already associated with you',
        });
      }
    }

    // Customer exists but is not associated with any SP for this service (orphaned for this service)
    return sendSuccess(res, {
      status: 'EXISTS_ORPHANED',
      customer: {
        customerId,
        phone: customerData.phone,
        name: customerData.name || '',
        address: customerData.address || '',
        email: customerData.email || '',
      },
    });
  } catch (error: any) {
    logger.error('Failed to search customer', error);
    return sendError(res, error);
  }
}

/**
 * Step 2a: Create new customer and associate with SP
 * SP sends: phone, name, address, email (optional)
 */
export async function createNewCustomerWithAssociation(req: AuthRequest, res: Response) {
  try {
    const { phone, name, address, email } = req.body;

    // Validation
    if (!phone || !validatePhoneNumber(phone)) {
      return sendError(res, new ValidationError('Valid 10-digit phone number is required'));
    }

    if (!name || name.trim().length === 0) {
      return sendError(res, new ValidationError('Customer name is required'));
    }

    if (!address || address.trim().length === 0) {
      return sendError(res, new ValidationError('Customer address is required'));
    }

    const spId = req.user?.uid;
    if (!spId) {
      return sendError(res, new ValidationError('Service Provider not authenticated'));
    }

    logger.info('Creating new customer by SP', { phone, name, spId });

    // Double-check customer doesn't already exist
    const existingCustomer = await db
      .collection('users')
      .where('phone', '==', phone)
      .where('role', '==', 'CUSTOMER')
      .limit(1)
      .get();

    if (!existingCustomer.empty) {
      return sendError(res, new ValidationError('Customer with this phone already exists'));
    }

    // Get SP's service ID
    const spServiceAssoc = await db
      .collection('users')
      .doc(spId)
      .collection('serviceAssociations')
      .limit(1)
      .get();

    if (spServiceAssoc.empty) {
      return sendError(res, new ValidationError('Service Provider has no assigned service'));
    }

    const serviceId = spServiceAssoc.docs[0].id;

    // Create Firebase Auth user (phone only)
    const authUser = await auth.createUser({
      phoneNumber: `+91${phone}`,
      displayName: name,
    });

    logger.info('Auth user created for new customer', { uid: authUser.uid, phone });

    // Create user document
    const userData = {
      uid: authUser.uid,
      phone,
      name,
      address,
      email: email || '',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      verified: false,
      verifiedMethod: null,
      createdBySP: spId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(authUser.uid).set(userData);
    logger.info('User document created', { uid: authUser.uid });

    // Create service association (ASSOCIATED status)
    const assocRef = db
      .collection('users')
      .doc(authUser.uid)
      .collection('serviceAssociations')
      .doc(serviceId);

    await assocRef.set({
      spId,
      status: 'ASSOCIATED',
      associationType: 'CREATED_BY_SP',
      createdAt: new Date(),
      createdBySP: spId,
    });

    logger.info('Service association created', {
      customerId: authUser.uid,
      serviceId,
      spId,
      status: 'ASSOCIATED',
    });

    // TODO: Send welcome email via Resend
    logger.info('Welcome email should be sent', {
      customerId: authUser.uid,
      email: email || phone,
    });

    return sendSuccess(
      res,
      {
        customerId: authUser.uid,
        phone,
        name,
        address,
        email,
        status: 'ASSOCIATED',
        message: 'Customer created and associated successfully',
      },
      201
    );
  } catch (error: any) {
    logger.error('Failed to create customer', error);
    return sendError(res, error);
  }
}

/**
 * Step 2b: Associate existing orphaned customer with SP
 * SP sends: customerId
 */
export async function associateExistingCustomer(req: AuthRequest, res: Response) {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return sendError(res, new ValidationError('Customer ID is required'));
    }

    const spId = req.user?.uid;
    if (!spId) {
      return sendError(res, new ValidationError('Service Provider not authenticated'));
    }

    logger.info('Associating existing customer', { customerId, spId });

    // Verify customer exists
    const customerDoc = await db.collection('users').doc(customerId).get();
    if (!customerDoc.exists || customerDoc.data()?.role !== 'CUSTOMER') {
      return sendError(res, new ValidationError('Customer not found'));
    }

    const customerData = customerDoc.data();

    // Get SP's service ID
    const spServiceAssoc = await db
      .collection('users')
      .doc(spId)
      .collection('serviceAssociations')
      .limit(1)
      .get();

    if (spServiceAssoc.empty) {
      return sendError(res, new ValidationError('Service Provider has no assigned service'));
    }

    const serviceId = spServiceAssoc.docs[0].id;

    // Check if customer is already associated with this SP for this service
    const existingAssoc = await db
      .collection('users')
      .doc(customerId)
      .collection('serviceAssociations')
      .doc(serviceId)
      .get();

    if (existingAssoc.exists) {
      const assocData = existingAssoc.data();
      if (assocData?.spId === spId) {
        return sendError(res, new ValidationError('Customer is already associated with you'));
      } else if (assocData?.spId) {
        return sendError(
          res,
          new ValidationError('Customer is already associated with another Service Provider')
        );
      }
    }

    // Create or update service association
    const assocRef = db
      .collection('users')
      .doc(customerId)
      .collection('serviceAssociations')
      .doc(serviceId);

    await assocRef.set({
      spId,
      status: 'ASSOCIATED',
      associationType: 'ASSOCIATED_BY_SP',
      createdAt: new Date(),
      associatedBySP: spId,
    });

    // Also update customer document to set createdBySP for easier querying
    // This allows getSPCustomers to find both created and associated customers
    await db.collection('users').doc(customerId).update({
      createdBySP: spId,
    });

    logger.info('Service association created for existing customer', {
      customerId,
      serviceId,
      spId,
    });

    return sendSuccess(res, {
      customerId,
      status: 'ASSOCIATED',
      message: 'Customer associated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to associate customer', error);
    return sendError(res, error);
  }
}
