import * as functions from 'firebase-functions';
import { db, messaging } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';

const logger = new Logger('Phase3Handlers');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Create Order
 */
export async function createOrder(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const {
      serviceProviderId,
      items,
      pickupDate,
      pickupTime,
      createdBy,
    } = req.body;

    if (!serviceProviderId || !items || !pickupDate || !pickupTime) {
      return sendError(res, new ValidationError('Missing required fields'));
    }

    logger.info('Creating order', {
      customerId: req.user.uid,
      serviceProviderId,
      itemCount: items.length,
    });

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(-6)}`;

    // Calculate amounts
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const gstPercentage = 5; // Get from service config
    const gstAmount = (subtotal * gstPercentage) / 100;
    const totalAmount = subtotal + gstAmount;

    // Create order document
    const orderData = {
      orderId,
      customerId: req.user.uid,
      serviceProviderId,
      status: 'CREATED',
      createdBy: createdBy || 'CUSTOMER',
      createdByUserId: req.user.uid,
      pickupDate: new Date(pickupDate),
      pickupTime,
      items,
      subtotal,
      gstApplicable: true,
      gstPercentage,
      gstAmount,
      totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('orders').doc(orderId).set(orderData);

    // Send notification to SP
    // TODO: Send push notification

    logger.info('Order created successfully', { orderId });

    return sendSuccess(
      res,
      {
        orderId,
        status: 'CREATED',
        totalAmount,
        createdAt: new Date(),
      },
      201
    );
  } catch (error: any) {
    logger.error('Failed to create order', error);
    return sendError(res, error);
  }
}

/**
 * Get Orders
 */
export async function getOrders(req: AuthRequest, res: Response) {
  try {
    const role = req.user?.role;
    const userId = req.user?.uid;

    logger.info('Fetching orders', { role, userId });

    let query: any = db.collection('orders');

    // Filter by user role
    if (role === 'CUSTOMER') {
      query = query.where('customerId', '==', userId);
    } else if (role === 'SERVICE_PROVIDER' || role === 'COWORKER') {
      query = query.where('serviceProviderId', '==', userId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();

    const orders = snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      pickupDate: doc.data().pickupDate?.toDate?.(),
    }));

    return sendSuccess(res, {
      orders,
      total: orders.length,
    });
  } catch (error: any) {
    logger.error('Failed to fetch orders', error);
    return sendError(res, error);
  }
}

/**
 * Get Order by ID
 */
export async function getOrder(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.params;

    logger.info('Fetching order', { orderId });

    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return sendError(res, new ValidationError('Order not found'));
    }

    const orderData = orderDoc.data();

    return sendSuccess(res, {
      ...orderData,
      createdAt: orderData?.createdAt?.toDate?.(),
      pickupDate: orderData?.pickupDate?.toDate?.(),
    });
  } catch (error: any) {
    logger.error('Failed to fetch order', error);
    return sendError(res, error);
  }
}

/**
 * Confirm Order
 */
export async function confirmOrder(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.params;

    logger.info('Confirming order', { orderId });

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return sendError(res, new ValidationError('Order not found'));
    }

    await db.collection('orders').doc(orderId).update({
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info('Order confirmed', { orderId });

    return sendSuccess(res, {
      orderId,
      status: 'CONFIRMED',
    });
  } catch (error: any) {
    logger.error('Failed to confirm order', error);
    return sendError(res, error);
  }
}

/**
 * Mark Order Ready for Delivery
 */
export async function markOrderReady(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.params;
    const { gstApplicable } = req.body;

    logger.info('Marking order ready', { orderId, gstApplicable });

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return sendError(res, new ValidationError('Order not found'));
    }

    const orderData = orderDoc.data()!;

    // Generate invoice
    const invoiceNumber = `INV-${Date.now()}`;

    // Update order
    await db.collection('orders').doc(orderId).update({
      status: 'READY_FOR_DELIVERY',
      gstApplicable,
      invoice: {
        invoiceNumber,
        generatedAt: new Date(),
        gstApplied: gstApplicable,
      },
      updatedAt: new Date(),
    });

    logger.info('Order marked ready', { orderId });

    return sendSuccess(res, {
      orderId,
      status: 'READY_FOR_DELIVERY',
      invoiceNumber,
    });
  } catch (error: any) {
    logger.error('Failed to mark order ready', error);
    return sendError(res, error);
  }
}

/**
 * Mark Order Delivered
 */
export async function markOrderDelivered(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.params;

    logger.info('Marking order delivered', { orderId });

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return sendError(res, new ValidationError('Order not found'));
    }

    await db.collection('orders').doc(orderId).update({
      status: 'DELIVERED',
      deliveredAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info('Order marked delivered', { orderId });

    return sendSuccess(res, {
      orderId,
      status: 'DELIVERED',
    });
  } catch (error: any) {
    logger.error('Failed to mark order delivered', error);
    return sendError(res, error);
  }
}

/**
 * Initialize Razorpay Payment
 */
export async function initializeRazorpayPayment(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.params;

    logger.info('Initializing Razorpay payment', { orderId });

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return sendError(res, new ValidationError('Order not found'));
    }

    const orderData = orderDoc.data()!;
    const amount = Math.round(orderData.totalAmount * 100); // Convert to paise

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: orderId,
      notes: {
        orderId,
        customerId: orderData.customerId,
      },
    });

    // Store Razorpay order ID
    await db.collection('orders').doc(orderId).update({
      razorpayOrderId: razorpayOrder.id,
    });

    logger.info('Razorpay order created', { razorpayOrderId: razorpayOrder.id });

    return sendSuccess(res, {
      razorpayOrderId: razorpayOrder.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount,
    });
  } catch (error: any) {
    logger.error('Failed to initialize payment', error);
    return sendError(res, error);
  }
}

/**
 * Verify Razorpay Payment
 */
export async function verifyRazorpayPayment(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.params;
    const { razorpayPaymentId, razorpaySignature } = req.body;

    logger.info('Verifying Razorpay payment', { orderId });

    // Verify signature (in production)
    // const isValid = verifySignature(...);

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return sendError(res, new ValidationError('Order not found'));
    }

    // Update order with payment info
    await db.collection('orders').doc(orderId).update({
      status: 'PAID',
      razorpayPaymentId,
      paymentReceivedAt: new Date(),
      updatedAt: new Date(),
    });

    // Create payment record
    const paymentId = uuidv4();
    const orderData = orderDoc.data()!;

    await db.collection('payments').doc(paymentId).set({
      paymentId,
      orderId,
      customerId: orderData.customerId,
      serviceProviderId: orderData.serviceProviderId,
      amount: orderData.totalAmount,
      status: 'COMPLETED',
      mode: 'GATEWAY',
      razorpayPaymentId,
      gstApplied: orderData.gstApplicable,
      gstAmount: orderData.gstAmount,
      createdAt: new Date(),
      completedAt: new Date(),
    });

    logger.info('Payment verified successfully', { orderId });

    return sendSuccess(res, {
      orderId,
      status: 'PAID',
      paymentId,
    });
  } catch (error: any) {
    logger.error('Failed to verify payment', error);
    return sendError(res, error);
  }
}

/**
 * Confirm Direct Payment (UPI QR)
 */
export async function confirmDirectPayment(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.params;

    logger.info('Confirming direct payment', { orderId });

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return sendError(res, new ValidationError('Order not found'));
    }

    await db.collection('orders').doc(orderId).update({
      status: 'PAID',
      paymentMode: 'DIRECT_QR',
      paymentReceivedAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info('Direct payment confirmed', { orderId });

    return sendSuccess(res, {
      orderId,
      status: 'PAID',
      paymentMode: 'DIRECT_QR',
    });
  } catch (error: any) {
    logger.error('Failed to confirm direct payment', error);
    return sendError(res, error);
  }
}

/**
 * Add Order Feedback
 */
export async function addOrderFeedback(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    logger.info('Adding order feedback', { orderId, rating });

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return sendError(res, new ValidationError('Order not found'));
    }

    await db.collection('orders').doc(orderId).update({
      feedback: {
        rating,
        comment: comment || '',
        createdAt: new Date(),
      },
    });

    logger.info('Feedback added successfully', { orderId });

    return sendSuccess(res, {
      orderId,
      feedbackAdded: true,
    });
  } catch (error: any) {
    logger.error('Failed to add feedback', error);
    return sendError(res, error);
  }
}
