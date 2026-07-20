import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, NotFoundError, ForbiddenError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';

const logger = new Logger('NotificationHandlers');

/**
 * Get today's unread notifications for the authenticated user, most recent first.
 */
export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    // Two equality filters only (userId, read) - resolved via automatic
    // single-field indexes, no composite index (and no deploy step) required.
    // The "today" cutoff and descending sort happen in-memory below instead
    // of via a range filter + orderBy, which would need one.
    const snapshot = await db
      .collection('notifications')
      .where('userId', '==', req.user.uid)
      .where('read', '==', false)
      .get();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const notifications = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const createdAtDate: Date | null = data.createdAt?.toDate?.() || null;
        return {
          id: doc.id,
          title: data.title,
          body: data.body,
          type: data.type,
          data: data.data || {},
          createdAt: createdAtDate ? createdAtDate.toISOString() : null,
          createdAtMs: createdAtDate ? createdAtDate.getTime() : 0,
        };
      })
      .filter((notification) => notification.createdAtMs >= startOfToday.getTime())
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .map(({ createdAtMs, ...notification }) => notification);

    return sendSuccess(res, { notifications });
  } catch (error: any) {
    logger.error('Failed to fetch notifications', error);
    return sendError(res, error);
  }
}

/**
 * Mark a single notification as read (removes it from the unread feed).
 */
export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { notificationId } = req.params;
    const ref = db.collection('notifications').doc(notificationId);
    const doc = await ref.get();

    if (!doc.exists) {
      return sendError(res, new NotFoundError('Notification not found'));
    }

    if (doc.data()?.userId !== req.user.uid) {
      return sendError(res, new ForbiddenError('Not allowed to modify this notification'));
    }

    await ref.update({ read: true, readAt: new Date() });

    return sendSuccess(res, { message: 'Notification marked as read' });
  } catch (error: any) {
    logger.error('Failed to mark notification as read', error);
    return sendError(res, error);
  }
}
