import { Request, Response } from 'express';
import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';

const logger = new Logger('GetSPOrders');

/**
 * Get orders for a Service Provider
 * GET /service-providers/:spId/orders?limit=10&startAfter={docId}
 */
export const getSPOrders = async (req: Request, res: Response) => {
  try {
    const { spId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50, default 10
    const startAfter = req.query.startAfter as string | undefined;

    if (!spId) {
      return res.status(400).json({
        success: false,
        error: 'Service Provider ID is required',
      });
    }

    // Verify SP exists
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists || spDoc.data()?.role !== 'SERVICE_PROVIDER') {
      return res.status(404).json({
        success: false,
        error: 'Service Provider not found',
      });
    }

    // Query without orderBy to avoid needing composite index
    // Frontend will handle sorting by date
    const snapshot = await db
      .collection('orders')
      .where('spId', '==', spId)
      .limit(limit + 1)
      .get();
    const hasMore = snapshot.docs.length > limit;
    const docsList = snapshot.docs.slice(0, limit);
    const orders = docsList.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        deliveryDateTime: data.deliveryDateTime?.toDate?.() || data.deliveryDateTime,
      };
    });

    logger.info('SP orders retrieved', { spId, count: orders.length, hasMore });

    return res.status(200).json({
      success: true,
      data: {
        orders,
        hasMore,
        lastDocId: docsList.length > 0 ? docsList[docsList.length - 1].id : null,
      },
    });
  } catch (error: any) {
    logger.error('Get SP orders failed', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to get orders',
    });
  }
};

/**
 * Get orders for a Customer
 * GET /customers/:customerId/orders?limit=10&startAfter={docId}
 */
export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const startAfter = req.query.startAfter as string | undefined;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required',
      });
    }

    // Verify customer exists
    const customerDoc = await db.collection('users').doc(customerId).get();
    if (!customerDoc.exists || customerDoc.data()?.role !== 'CUSTOMER') {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Query without orderBy to avoid needing composite index
    // Frontend will handle sorting by date
    const snapshot = await db
      .collection('orders')
      .where('customerId', '==', customerId)
      .limit(limit + 1)
      .get();
    const hasMore = snapshot.docs.length > limit;
    const docsList = snapshot.docs.slice(0, limit);
    const orders = docsList.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        deliveryDateTime: data.deliveryDateTime?.toDate?.() || data.deliveryDateTime,
      };
    });

    logger.info('Customer orders retrieved', { customerId, count: orders.length, hasMore });

    return res.status(200).json({
      success: true,
      data: {
        orders,
        hasMore,
        lastDocId: docsList.length > 0 ? docsList[docsList.length - 1].id : null,
      },
    });
  } catch (error: any) {
    logger.error('Get customer orders failed', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to get orders',
    });
  }
};
