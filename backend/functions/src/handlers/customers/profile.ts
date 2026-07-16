import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';

const logger = new Logger('CustomerProfileHandlers');

/**
 * Update customer profile
 */
export async function updateCustomerProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { userId } = req.params;
    const { name, email, address, area, city, pin } = req.body;

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

    logger.info('Updating customer profile', { userId });

    // Update user document
    const updateData: any = {
      name: name.trim(),
      email: email.trim(),
    };

    // Add optional fields if provided
    if (address) updateData.address = address.trim();
    if (area) updateData.area = area.trim();
    if (city) updateData.city = city.trim();
    if (pin) updateData.pin = pin.trim();

    updateData.updatedAt = new Date();

    await db.collection('users').doc(userId).update(updateData);

    logger.info('Customer profile updated successfully', { userId });

    return sendSuccess(res, {
      message: 'Profile updated successfully',
      data: updateData,
    });
  } catch (error: any) {
    logger.error('Error updating customer profile', { error });
    return sendError(res, error);
  }
}
