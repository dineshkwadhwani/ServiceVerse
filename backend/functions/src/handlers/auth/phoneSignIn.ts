import { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { Response } from 'express';

const logger = new Logger('PhoneSignInHandlers');

/**
 * Handle phone sign-in completion - set custom claims and migrate seeded user documents
 * Called after Firebase Auth phone sign-in is successful
 */
export async function completePhoneSignIn(req: any, res: Response) {
  try {
    const { uid, phone } = req.body;

    if (!uid || !phone) {
      return sendError(res, new ValidationError('Missing uid or phone'));
    }

    logger.info('Completing phone sign-in', { uid, phone });

    // Look up if this phone number was pre-seeded (e.g., SuperAdmin)
    const phoneToUserRef = db.collection('phoneToUser').doc(phone);
    const phoneToUserDoc = await phoneToUserRef.get();

    if (phoneToUserDoc.exists) {
      const { uid: tempUid, role, email } = phoneToUserDoc.data() as any;

      logger.info('Found pre-seeded user for phone', { tempUid, role, phone });

      // Get the original user document
      const originalUserDoc = await db.collection('users').doc(tempUid).get();

      if (originalUserDoc.exists) {
        const userData = originalUserDoc.data();

        // Create new user document with the Firebase Auth UID
        await db.collection('users').doc(uid).set({
          ...userData,
          uid,
          phone,
        });

        logger.info('Migrated user document to auth UID', { from: tempUid, to: uid });

        // Set custom claims on the auth user
        await auth.setCustomUserClaims(uid, { role });
        logger.info('Set custom claims', { uid, role });

        // Delete the temporary document
        await db.collection('users').doc(tempUid).delete();

        // Delete the phone-to-user mapping
        await phoneToUserRef.delete();

        return sendSuccess(res, {
          uid,
          phone,
          role,
          email,
          message: 'Phone sign-in completed successfully',
        });
      }
    }

    // For already-created users (including AMs, SPs, Customers), check users collection
    let userQuery = await db.collection('users').where('phone', '==', phone).limit(1).get();

    // If not found, try with +91 prefix
    if (userQuery.empty && !phone.startsWith('+91')) {
      userQuery = await db.collection('users').where('phone', '==', `+91${phone}`).limit(1).get();
      logger.info('User not found without +91, trying with +91 prefix', { phone });
    }

    // If still not found, try without +91 prefix
    if (userQuery.empty && phone.startsWith('+91')) {
      const phoneWithout91 = phone.substring(3);
      userQuery = await db.collection('users').where('phone', '==', phoneWithout91).limit(1).get();
      logger.info('User not found with +91, trying without prefix', { phone, phoneWithout91 });
    }

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();
      const role = userData.role;

      logger.info('Found existing user', { uid, phone, role });

      if (role) {
        // Set custom claims for this user
        await auth.setCustomUserClaims(uid, { role });
        logger.info('Set custom claims for existing user', { uid, phone, role });

        return sendSuccess(res, {
          uid,
          phone,
          role,
          message: 'Phone sign-in completed and custom claims set',
        });
      }
    }

    logger.warn('User not found, no role to set', { uid, phone });

    // If not found in users collection, just verify the auth user exists and return success
    const authUser = await auth.getUser(uid);
    logger.info('Auth user verified', { uid, phone: authUser.phoneNumber });

    return sendSuccess(res, {
      uid,
      phone,
      message: 'Phone sign-in verified',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to complete phone sign-in';
    logger.error('Phone sign-in error', { error: message });
    return sendError(res, new Error(message));
  }
}
