import * as functions from 'firebase-functions';
import { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
const Resend = require('resend').Resend;

const logger = new Logger('AuthHandlers');

// Lazy initialize Resend - will be created only when needed
let resend: any = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Register a new customer user
 */
export async function registerCustomer(req: any, res: Response) {
  try {
    const { name, email, phone, address, city, pin, serviceId, verifiedMethod } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !serviceId || !verifiedMethod) {
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
    const authUser = await auth.createUser({
      email,
      phoneNumber: `+91${phone}`,
    });

    logger.info('Auth user created', { uid: authUser.uid });

    // Set custom claims for role
    await auth.setCustomUserClaims(authUser.uid, {
      role: 'CUSTOMER',
    });

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

    await db.collection('users').doc(authUser.uid).set(userData);

    logger.info('User document created', { uid: authUser.uid });

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

    return sendSuccess(res, {
      uid: authUser.uid,
      email,
      role: 'CUSTOMER',
      serviceId,
      message: 'Customer registered successfully',
    }, 201);
  } catch (error: any) {
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

    // Validate required fields
    if (!businessName || !ownerName || !email || !phone || !serviceId || !verifiedMethod) {
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

    // Create user in Firebase Auth
    const authUser = await auth.createUser({
      email,
      phoneNumber: `+91${phone}`,
    });

    logger.info('Auth user created', { uid: authUser.uid });

    // Set custom claims for role
    await auth.setCustomUserClaims(authUser.uid, {
      role: 'SERVICE_PROVIDER',
    });

    // Create user document in Firestore
    const userData = {
      uid: authUser.uid,
      businessName,
      ownerName,
      email,
      phone,
      role: 'SERVICE_PROVIDER',
      verified: verifiedMethod ? true : false,
      verifiedMethod: verifiedMethod || null,
      status: 'PENDING', // Awaiting account manager assignment
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(authUser.uid).set(userData);

    logger.info('Service Provider user document created', { uid: authUser.uid });

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

    return sendSuccess(res, {
      uid: authUser.uid,
      email,
      role: 'SERVICE_PROVIDER',
      serviceId,
      status: 'PENDING',
      message: 'Service Provider registered successfully. Pending account manager assignment.',
    }, 201);
  } catch (error: any) {
    logger.error('Service Provider registration failed', error);
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
          from: 'noreply@serviceverse.app',
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
