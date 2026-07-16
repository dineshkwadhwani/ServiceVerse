import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';

const logger = new Logger('CoworkerProfileHandlers');

/**
 * Update coworker profile
 */
export async function updateCoworkerProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { userId } = req.params;
    const { name, email } = req.body;

    // Ensure user can only update their own profile
    if (req.user.uid !== userId) {
      return sendError(res, new ValidationError('Cannot update another user\'s profile'));
    }

    // Validate required fields
    if (!name || !email) {
      return sendError(res, new ValidationError('Name and email are required'));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, new ValidationError('Invalid email address'));
    }

    logger.info('Updating coworker profile', { userId });

    // Update user document
    const updateData = {
      name: name.trim(),
      email: email.trim(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(userId).update(updateData);

    logger.info('Coworker profile updated successfully', { userId });

    return sendSuccess(res, {
      message: 'Profile updated successfully',
      data: updateData,
    });
  } catch (error: any) {
    logger.error('Error updating coworker profile', { error });
    return sendError(res, error);
  }
}
