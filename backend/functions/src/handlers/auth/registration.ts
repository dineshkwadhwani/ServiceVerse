import * as functions from 'firebase-functions';
import admin, { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import { sendNotificationByEvent } from '@/utils/notificationCenter';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
const Resend = require('resend').Resend;

const logger = new Logger('AuthHandlers');

// Lazy initialize Resend - will be created only when needed
let resend: any = null;

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY || functions.config().resend?.api_key;
    if (apiKey) {
      resend = new Resend(apiKey);
    }
  }
  return resend;
}

function getFromEmail() {
  return (
    process.env.FROM_EMAIL_ADDRESS ||
    functions.config().email?.from_address ||
    'onboarding@resend.dev'
  );
}

/**
 * Register a new customer user
 */
export async function registerCustomer(req: any, res: Response) {
  try {
    const { name, email, phone, address, city, pin, serviceId, verifiedMethod } = req.body;

    console.log('registerCustomer called with:', { name, email, phone, serviceId, verifiedMethod });

    // Validate required fields
    if (!name || !email || !phone || !serviceId || !verifiedMethod) {
      console.log('Missing required fields:', { name, email, phone, serviceId, verifiedMethod });
      return sendError(res, new ValidationError('Missing required fields'));
    }

    logger.info('Registering customer', { email, phone });

    // Check if email + CUSTOMER role already exists
    const emailCheck = await db
      .collection('users')
      .where('email', '==', email)
      .where('role', '==', 'CUSTOMER')
      .limit(1)
      .get();

    if (!emailCheck.empty) {
      return sendError(res, new ValidationError('Email already registered as Customer'));
    }

    // Check if phone + CUSTOMER role already exists
    const phoneCheck = await db
      .collection('users')
      .where('phone', '==', phone)
      .where('role', '==', 'CUSTOMER')
      .limit(1)
      .get();

    if (!phoneCheck.empty) {
      return sendError(res, new ValidationError('Phone number already registered as Customer'));
    }

    // Create user in Firebase Auth (phone-based, no password)
    let authUser;
    let isNewAuthUser = false;
    try {
      authUser = await auth.createUser({
        email,
        phoneNumber: `+91${phone}`,
      });
      console.log('New auth user created', { uid: authUser.uid });
      logger.info('Auth user created', { uid: authUser.uid });
      isNewAuthUser = true;
    } catch (authError: any) {
      // If user already exists with this phone, registration was incomplete - complete it now
      if (authError.code === 'auth/phone-number-already-exists') {
        console.log('Phone number already exists (incomplete registration), retrieving auth user to complete registration');
        try {
          authUser = await auth.getUserByPhoneNumber(`+91${phone}`);
          console.log('Found existing auth user, completing registration', { uid: authUser.uid });
          // Update email if different
          if (authUser.email !== email) {
            await auth.updateUser(authUser.uid, { email });
          }
          isNewAuthUser = false; // User already existed in Auth
        } catch (findError: any) {
          console.error('Could not find user with phone:', findError.message);
          throw authError; // Throw original error if user not found
        }
      } else {
        throw authError;
      }
    }

    // Set custom claims for role (only if new user)
    if (isNewAuthUser) {
      await auth.setCustomUserClaims(authUser.uid, {
        role: 'CUSTOMER',
      });
    }

    // Create user document in Firestore
    const userData = {
      uid: authUser.uid,
      name,
      email,
      phone,
      role: 'CUSTOMER',
      address: address || '',
      city: city || '',
      pin: pin || '',
      verified: verifiedMethod ? true : false,
      verifiedMethod: verifiedMethod || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if user document already exists
    const userDoc = await db.collection('users').doc(authUser.uid).get();
    if (userDoc.exists) {
      console.log('User document already exists, updating it');
      await db.collection('users').doc(authUser.uid).update({
        ...userData,
        updatedAt: new Date(),
      });
    } else {
      console.log('Creating new user document with:', userData);
      await db.collection('users').doc(authUser.uid).set(userData);
      console.log('User document created successfully');
    }

    logger.info('User document created/updated', { uid: authUser.uid });

    // Create service association
    const associationId = uuidv4();
    const association = {
      associationId,
      userId: authUser.uid,
      serviceId,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      joinedDate: new Date(),
      isActive: true,
      createdAt: new Date(),
    };

    await db
      .collection('users')
      .doc(authUser.uid)
      .collection('serviceAssociations')
      .doc(serviceId)
      .set(association);

    logger.info('Service association created', { userId: authUser.uid, serviceId });

    await sendNotificationByEvent('ACCOUNT_CREATED', {
      userId: authUser.uid,
      name,
      email,
      role: 'CUSTOMER',
    });

    return sendSuccess(res, {
      uid: authUser.uid,
      email,
      role: 'CUSTOMER',
      serviceId,
      message: 'Customer registered successfully',
    }, 201);
  } catch (error: any) {
    console.error('Customer registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    logger.error('Customer registration failed', error);
    return sendError(res, error);
  }
}

/**
 * Register a new service provider user
 */
export async function registerServiceProvider(req: any, res: Response) {
  try {
    const { businessName, ownerName, email, phone, serviceId, verifiedMethod } = req.body;

    console.log('registerServiceProvider called with:', { businessName, ownerName, email, phone, serviceId, verifiedMethod });

    // Validate required fields
    if (!businessName || !ownerName || !email || !phone || !serviceId || !verifiedMethod) {
      console.log('Missing required fields');
      return sendError(res, new ValidationError('Missing required fields'));
    }

    logger.info('Registering service provider', { email, phone });

    // Check if email + SERVICE_PROVIDER role already exists
    const emailCheck = await db
      .collection('users')
      .where('email', '==', email)
      .where('role', '==', 'SERVICE_PROVIDER')
      .limit(1)
      .get();

    if (!emailCheck.empty) {
      return sendError(res, new ValidationError('Email already registered as Service Provider'));
    }

    // Check if phone + SERVICE_PROVIDER role already exists
    const phoneCheck = await db
      .collection('users')
      .where('phone', '==', phone)
      .where('role', '==', 'SERVICE_PROVIDER')
      .limit(1)
      .get();

    if (!phoneCheck.empty) {
      return sendError(res, new ValidationError('Phone number already registered as Service Provider'));
    }

    const serviceDoc = await db.collection('services').doc(serviceId).get();
    const serviceName = serviceDoc.exists ? (serviceDoc.data() as any)?.name || '' : '';

    // Create user in Firebase Auth
    let authUser;
    let isNewAuthUser = false;
    try {
      authUser = await auth.createUser({
        email,
        phoneNumber: `+91${phone}`,
      });
      console.log('New auth user created', { uid: authUser.uid });
      logger.info('Auth user created', { uid: authUser.uid });
      isNewAuthUser = true;
    } catch (authError: any) {
      // If user already exists with this phone, registration was incomplete - complete it now
      if (authError.code === 'auth/phone-number-already-exists') {
        console.log('Phone number already exists (incomplete registration), retrieving auth user to complete registration');
        try {
          authUser = await auth.getUserByPhoneNumber(`+91${phone}`);
          console.log('Found existing auth user, completing registration', { uid: authUser.uid });
          // Update email if different
          if (authUser.email !== email) {
            await auth.updateUser(authUser.uid, { email });
          }
          isNewAuthUser = false; // User already existed in Auth
        } catch (findError: any) {
          console.error('Could not find user with phone:', findError.message);
          throw authError; // Throw original error if user not found
        }
      } else {
        throw authError;
      }
    }

    // Set custom claims for role (only if new user)
    if (isNewAuthUser) {
      await auth.setCustomUserClaims(authUser.uid, {
        role: 'SERVICE_PROVIDER',
      });
    }

    // Create user document in Firestore
    const userData = {
      uid: authUser.uid,
      businessName,
      ownerName,
      email,
      phone,
      role: 'SERVICE_PROVIDER',
      service: {
        serviceId,
        serviceName: '', // Will be fetched and updated if needed
      },
      verified: verifiedMethod ? true : false,
      verifiedMethod: verifiedMethod || null,
      status: 'PENDING', // Awaiting account manager assignment
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if user document already exists
    const userDoc = await db.collection('users').doc(authUser.uid).get();
    if (userDoc.exists) {
      console.log('User document already exists, updating it');
      await db.collection('users').doc(authUser.uid).update({
        ...userData,
        updatedAt: new Date(),
      });
    } else {
      console.log('Creating new user document');
      await db.collection('users').doc(authUser.uid).set(userData);
    }

    logger.info('Service Provider user document created/updated', { uid: authUser.uid });

    // Create service association
    const associationId = uuidv4();
    const association = {
      associationId,
      userId: authUser.uid,
      serviceId,
      role: 'SERVICE_PROVIDER',
      status: 'INACTIVE', // Inactive until onboarded by account manager
      joinedDate: new Date(),
      isActive: false,
      createdAt: new Date(),
    };

    await db
      .collection('users')
      .doc(authUser.uid)
      .collection('serviceAssociations')
      .doc(serviceId)
      .set(association);

    logger.info('Service association created', { userId: authUser.uid, serviceId });

    await sendNotificationByEvent('ACCOUNT_CREATED', {
      userId: authUser.uid,
      name: ownerName,
      email,
      role: 'SERVICE_PROVIDER',
    });

    await sendNotificationByEvent('SP_REGISTERED', {
      spId: authUser.uid,
      businessName,
      email,
      serviceName,
    });

    return sendSuccess(res, {
      uid: authUser.uid,
      email,
      role: 'SERVICE_PROVIDER',
      serviceId,
      status: 'PENDING',
      message: 'Service Provider registered successfully. Pending account manager assignment.',
    }, 201);
  } catch (error: any) {
    console.error('Service Provider registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    logger.error('Service Provider registration failed', error);
    return sendError(res, error);
  }
}

/**
 * Complete registration after phone verification
 * This is called AFTER phone OTP is verified with Firebase Auth
 * It creates the Firestore user document if it doesn't exist
 * If document exists, user is already registered (login flow)
 */
export async function completeRegistration(req: any, res: Response) {
  try {
    // User should be authenticated via Firebase Auth at this point
    const firebaseUser = req.user; // From middleware
    if (!firebaseUser) {
      return sendError(res, new ValidationError('User not authenticated via phone verification'));
    }

    const { uid: userId, email: firebaseEmail, phoneNumber } = firebaseUser;
    const { name, email, phone, address, area, city, pin, serviceId, role, businessName, ownerName } = req.body;

    console.log('completeRegistration called', { userId, email, phone, role, serviceId });

    if (!name || !email || !phone || !role || !serviceId) {
      return sendError(res, new ValidationError('Missing required fields: name, email, phone, role, serviceId'));
    }

    // Extract phone number without +91
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Check if user document already exists
    const userDoc = await db.collection('users').doc(userId).get();

    if (userDoc.exists) {
      // User already registered, just return success (login flow)
      console.log('User document already exists, registration already complete (login flow)', { userId });
      return sendSuccess(res, {
        uid: userId,
        email,
        role,
        serviceId,
        message: 'User already registered, logging in',
      }, 200);
    }

    // User document doesn't exist, create it (registration flow)
    console.log('Creating user document for new registration');

    const userData: any = {
      uid: userId,
      name,
      email,
      phone: cleanPhone,
      role,
      verified: true,
      verifiedMethod: 'phone',
      status: role === 'SERVICE_PROVIDER' ? 'PENDING' : 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add SP-specific fields if this is a service provider
    if (role === 'SERVICE_PROVIDER') {
      userData.businessName = businessName || name;
      userData.ownerName = ownerName || name;
      userData.address = address || '';
      userData.area = area || '';
      userData.city = city || '';
      userData.pin = pin || '';
    } else {
      // For other roles
      userData.address = address || '';
      userData.area = area || '';
      userData.city = city || '';
      userData.pin = pin || '';
    }

    // If SP, add service info
    if (role === 'SERVICE_PROVIDER' && serviceId) {
      userData.service = {
        serviceId,
        serviceName: '', // Will be fetched and updated if needed
      };
    }

    // Create user document
    await db.collection('users').doc(userId).set(userData);
    console.log('User document created successfully', { userId });
    logger.info('User document created', { uid: userId, role });

    // If service provider, create service association AND onboarding request
    if (role === 'SERVICE_PROVIDER' && serviceId) {
      const associationId = uuidv4();
      const association = {
        associationId,
        userId,
        serviceId,
        role: 'SERVICE_PROVIDER',
        status: 'INACTIVE',
        joinedDate: new Date(),
        isActive: false,
        createdAt: new Date(),
      };

      await db
        .collection('users')
        .doc(userId)
        .collection('serviceAssociations')
        .doc(serviceId)
        .set(association);

      console.log('Service association created', { userId, serviceId });
      logger.info('Service association created', { userId, serviceId });

      // Create approval request for SuperAdmin
      const approvalRequestId = uuidv4();
      const approvalRequest = {
        requestId: approvalRequestId,
        requestType: 'SP_REGISTRATION', // Type of approval request
        userId,
        serviceId,
        userEmail: email,
        userName: name,
        businessName: (req.body as any).businessName || name,
        city: (req.body as any).city || null, // City from SP registration
        approverName: null, // Set when assigned to AM
        approverPhone: null, // Set when assigned to AM
        status: 'PENDING_AM_ASSIGNMENT',
        assignedAccountManagerId: null,
        onboardingSteps: {
          profileComplete: false,
          documentsUploaded: false,
          workingHoursSet: false,
          commissionsSet: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db
        .collection('approvals')
        .doc(approvalRequestId)
        .set(approvalRequest);

      console.log('SP approval request created', { requestId: approvalRequestId, userId, serviceId });
      logger.info('SP approval request created', { requestId: approvalRequestId, userId, serviceId });
    }

    // If customer, create service association
    if (role === 'CUSTOMER' && serviceId) {
      const associationId = uuidv4();
      const association = {
        associationId,
        userId,
        serviceId,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        joinedDate: new Date(),
        isActive: true,
        createdAt: new Date(),
      };

      await db
        .collection('users')
        .doc(userId)
        .collection('serviceAssociations')
        .doc(serviceId)
        .set(association);

      console.log('Service association created', { userId, serviceId });
      logger.info('Service association created', { userId, serviceId });
    }

    // Set custom claims for role
    await auth.setCustomUserClaims(userId, { role });
    console.log('Custom claims set', { userId, role });

    await sendNotificationByEvent('ACCOUNT_CREATED', {
      userId,
      name,
      email,
      role,
    });

    if (role === 'SERVICE_PROVIDER') {
      const serviceDoc = await db.collection('services').doc(serviceId).get();
      const serviceName = serviceDoc.exists ? (serviceDoc.data() as any)?.name || '' : '';
      await sendNotificationByEvent('SP_REGISTERED', {
        spId: userId,
        businessName: (req.body as any).businessName || name,
        email,
        serviceName,
      });
    }

    return sendSuccess(res, {
      uid: userId,
      email,
      role,
      serviceId,
      message: 'User registered successfully',
    }, 201);
  } catch (error: any) {
    console.error('Complete registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    logger.error('Complete registration failed', error);
    return sendError(res, error);
  }
}

/**
 * Send email OTP
 */
export async function sendEmailOTP(req: any, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, new ValidationError('Email is required'));
    }

    logger.info('Sending email OTP', { email });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Firestore with expiry (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.collection('otps').doc(email).set(
      {
        email,
        otp,
        type: 'EMAIL',
        expiresAt,
        createdAt: new Date(),
      },
      { merge: true }
    );

    // Send email OTP using Resend
    const emailService = getResend();
    if (emailService) {
      try {
        await emailService.emails.send({
          from: getFromEmail(),
          to: email,
          subject: 'Your ServiceVerse Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p style="color: #666; font-size: 16px;">Your verification code is:</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #3B82F6; margin: 0;">${otp}</p>
              </div>
              <p style="color: #999; font-size: 14px;">This code expires in 10 minutes.</p>
              <p style="color: #999; font-size: 12px;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
          `,
        });
        logger.info('OTP email sent successfully', { email });
      } catch (emailError: any) {
        logger.error('Failed to send OTP email', emailError, { email });
        // Still return success - OTP is stored, user can request resend
      }
    } else {
      logger.warn('RESEND_API_KEY not configured, OTP not sent via email', { email, otp });
    }

    return sendSuccess(res, {
      message: 'OTP sent to email',
      email,
    });
  } catch (error: any) {
    logger.error('Failed to send email OTP', error);
    return sendError(res, error);
  }
}

/**
 * Verify email OTP
 */
export async function verifyEmailOTP(req: any, res: Response) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(res, new ValidationError('Email and OTP are required'));
    }

    logger.info('Verifying email OTP', { email });

    // Get OTP from Firestore
    const otpDoc = await db.collection('otps').doc(email).get();

    if (!otpDoc.exists) {
      return sendError(res, new ValidationError('No OTP found for this email'));
    }

    const otpData = otpDoc.data();

    if (!otpData) {
      return sendError(res, new ValidationError('OTP data not found'));
    }

    // Check if OTP has expired
    if (new Date() > otpData.expiresAt.toDate()) {
      return sendError(res, new ValidationError('OTP has expired'));
    }

    // Check if OTP matches
    if (otpData.otp !== otp) {
      return sendError(res, new ValidationError('Invalid OTP'));
    }

    // Delete OTP after successful verification
    await db.collection('otps').doc(email).delete();

    logger.info('Email OTP verified successfully', { email });

    return sendSuccess(res, {
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    logger.error('Failed to verify email OTP', error);
    return sendError(res, error);
  }
}

/**
 * Send phone OTP
 */
export async function sendPhoneOTP(req: any, res: Response) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return sendError(res, new ValidationError('Phone is required'));
    }

    logger.info('Sending phone OTP', { phone });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Firestore with expiry (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.collection('otps').doc(phone).set(
      {
        phone,
        otp,
        type: 'PHONE',
        expiresAt,
        createdAt: new Date(),
      },
      { merge: true }
    );

    // TODO: Send phone OTP using Firebase Phone Auth or SMS service
    logger.info('OTP generated and stored', { phone, otp });

    return sendSuccess(res, {
      message: 'OTP sent to phone',
      phone,
    });
  } catch (error: any) {
    logger.error('Failed to send phone OTP', error);
    return sendError(res, error);
  }
}

/**
 * Verify phone OTP
 */
export async function verifyPhoneOTP(req: any, res: Response) {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return sendError(res, new ValidationError('Phone and OTP are required'));
    }

    logger.info('Verifying phone OTP', { phone });

    // Get OTP from Firestore
    const otpDoc = await db.collection('otps').doc(phone).get();

    if (!otpDoc.exists) {
      return sendError(res, new ValidationError('No OTP found for this phone'));
    }

    const otpData = otpDoc.data();

    if (!otpData) {
      return sendError(res, new ValidationError('OTP data not found'));
    }

    // Check if OTP has expired
    if (new Date() > otpData.expiresAt.toDate()) {
      return sendError(res, new ValidationError('OTP has expired'));
    }

    // Check if OTP matches
    if (otpData.otp !== otp) {
      return sendError(res, new ValidationError('Invalid OTP'));
    }

    // Delete OTP after successful verification
    await db.collection('otps').doc(phone).delete();

    logger.info('Phone OTP verified successfully', { phone });

    return sendSuccess(res, {
      success: true,
      message: 'Phone verified successfully',
    });
  } catch (error: any) {
    logger.error('Failed to verify phone OTP', error);
    return sendError(res, error);
  }
}

/**
 * Register push token for authenticated user
 */
export async function registerPushToken(req: any, res: Response) {
  try {
    const user = req.user;
    const { token } = req.body || {};

    if (!user?.uid) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    if (!token || typeof token !== 'string') {
      return sendError(res, new ValidationError('Valid push token is required'));
    }

    await db.collection('users').doc(user.uid).set(
      {
        fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return sendSuccess(res, { message: 'Push token registered successfully' });
  } catch (error: any) {
    logger.error('Failed to register push token', error);
    return sendError(res, error);
  }
}
