import { Request, Response } from 'express';
import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { sendNotificationByEvent } from '@/utils/notificationCenter';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const logger = new Logger('CreateOrder');

let razorpayClient: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayClient;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  customPrice: number;
  qty: number;
  itemTotal: number;
}

interface CreateOrderRequest {
  spId: string;
  customerId: string;
  customerPhone: string;
  customerName: string;
  customerAddress: string;
  deliveryAddress: string;
  deliveryDateTime?: string;
  specialInstructions?: string;
  paymentMethod: 'ONLINE' | 'DIRECT';
  deliveryType: 'DROP' | 'PICKUP';
  selectedCoworker?: string;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  total: number;
  applyGST: boolean;
}

/**
 * Create a new order
 * POST /orders
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const data: CreateOrderRequest = req.body;
    const authUser = (req as any).user;
    const createdByRole = authUser?.role || 'SERVICE_PROVIDER';
    const createdByUserId = authUser?.uid || '';

    // Validation
    // Items aren't required when the customer creates the order, or when it's a pickup -
    // the coworker/SP adds items once the goods are actually picked up.
    const itemsRequired = createdByRole !== 'CUSTOMER' && data.deliveryType !== 'PICKUP';
    if (!data.spId || !data.customerId || !data.customerPhone || !data.items || (itemsRequired && data.items.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: spId, customerId, customerPhone, items',
      });
    }

    if (!data.paymentMethod || !['ONLINE', 'DIRECT'].includes(data.paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method. Must be ONLINE or DIRECT.',
      });
    }

    // Coworker can create orders only for their own associated SP
    if (authUser?.role === 'COWORKER' && authUser?.spId !== data.spId) {
      return res.status(403).json({
        success: false,
        error: 'Coworker can create orders only for their assigned service provider',
      });
    }

    // Customer can create only for themselves
    if (authUser?.role === 'CUSTOMER' && authUser?.uid !== data.customerId) {
      return res.status(403).json({
        success: false,
        error: 'Customers can only create orders for their own account',
      });
    }

    // Verify SP exists
    const spDoc = await db.collection('users').doc(data.spId).get();
    if (!spDoc.exists || spDoc.data()?.role !== 'SERVICE_PROVIDER') {
      return res.status(404).json({
        success: false,
        error: 'Service Provider not found',
      });
    }

    const spDocumentation = spDoc.data()?.documentation || {};
    const isSpGstMandatory = !!spDocumentation.gstCollectionMandatory;
    if (data.paymentMethod === 'ONLINE' && !isSpGstMandatory) {
      return res.status(400).json({
        success: false,
        error: 'Online payment is available only when GST collection is mandatory for this Service Provider.',
      });
    }

    // Verify customer exists
    const customerDoc = await db.collection('users').doc(data.customerId).get();
    if (!customerDoc.exists || customerDoc.data()?.role !== 'CUSTOMER') {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Get SP's configured menu items from their profile
    const spCustomMenus = spDoc.data()?.customMenus || {};

    // Get the service ID to find the configured menu
    const serviceAssociations = await db
      .collection('users')
      .doc(data.spId)
      .collection('serviceAssociations')
      .limit(1)
      .get();

    if (!serviceAssociations.empty) {
      const serviceId = serviceAssociations.docs[0].id;
      const configuredMenuItems = (spCustomMenus[serviceId] || []) as any[];

      // Build a set of valid menu item IDs
      const validMenuItems = new Set(configuredMenuItems.map((item: any) => item.menuItemId));

      // Verify all order items exist in the SP's menu
      for (const item of data.items) {
        if (!validMenuItems.has(item.menuItemId)) {
          logger.warn('Menu item not found in SP menu', {
            spId: data.spId,
            serviceId,
            menuItemId: item.menuItemId,
            availableItems: Array.from(validMenuItems),
          });
          return res.status(400).json({
            success: false,
            error: `Menu item ${item.menuItemId} not found in SP's menu`,
          });
        }
      }
    }

    // Create order
    const orderId = db.collection('orders').doc().id;
    const now = new Date();

    const order = {
      orderId,
      spId: data.spId,
      customerId: data.customerId,
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      customerAddress: data.customerAddress,
      deliveryAddress: data.deliveryAddress || data.customerAddress,
      deliveryDateTime: data.deliveryDateTime ? new Date(data.deliveryDateTime) : null,
      specialInstructions: data.specialInstructions || '',
      paymentMethod: data.paymentMethod,
      deliveryType: data.deliveryType,
      selectedCoworker: data.selectedCoworker || '',
      items: data.items,
      subtotal: data.subtotal,
      gst: data.gst,
      total: data.total,
      applyGST: data.applyGST,
      createdBy: createdByRole,
      createdByRole,
      createdByUserId,
      status: 'NEW',
      createdAt: now,
      updatedAt: now,
    };

    // Save order
    await db.collection('orders').doc(orderId).set(order);

    // Update customer's order count
    const customerRef = db.collection('users').doc(data.customerId);
    await customerRef.update({
      totalOrders: (customerDoc.data()?.totalOrders || 0) + 1,
    });

    // Update SP's order count
    const spRef = db.collection('users').doc(data.spId);
    await spRef.update({
      totalOrders: (spDoc.data()?.totalOrders || 0) + 1,
    });

    logger.info('Order created', {
      orderId,
      spId: data.spId,
      customerId: data.customerId,
      total: data.total,
    });

    const creatorRole = createdByRole;
    const notifyUserIds: string[] =
      creatorRole === 'CUSTOMER' ? [data.spId] : [data.customerId];

    await sendNotificationByEvent('ORDER_CREATED', {
      orderId,
      notifyUserIds,
      creatorRole,
    });

    return res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    logger.error('Create order failed', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to create order',
    });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const orderData: any = orderDoc.data() || {};
    return res.status(200).json({
      success: true,
      data: {
        ...orderData,
        createdAt: orderData.createdAt?.toDate?.() || orderData.createdAt,
        updatedAt: orderData.updatedAt?.toDate?.() || orderData.updatedAt,
        deliveryDateTime: orderData.deliveryDateTime?.toDate?.() || orderData.deliveryDateTime,
      },
    });
  } catch (error: any) {
    logger.error('Get order by ID failed', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch order' });
  }
};

export const updateOrderLifecycle = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, selectedCoworker, paymentProofUrl } = req.body || {};
    const authUser: any = (req as any).user;

    if (!orderId || !status) {
      return res.status(400).json({ success: false, error: 'orderId and status are required' });
    }

    const allowedStatuses = new Set([
      'CONFIRMED',
      'ASSIGNED_FOR_PICKUP',
      'READY_FOR_DELIVERY',
      'DELIVERED',
      'PAID',
      'COMPLETED',
    ]);

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ success: false, error: `Invalid status: ${status}` });
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const orderData: any = orderDoc.data() || {};
    const role = authUser?.role;

    if (!role) {
      return res.status(403).json({ success: false, error: 'User role not found' });
    }

    if (role === 'CUSTOMER' && authUser?.uid !== orderData.customerId) {
      return res.status(403).json({ success: false, error: 'Customers can update only their own orders' });
    }

    if (role === 'SERVICE_PROVIDER' && authUser?.uid !== orderData.spId) {
      return res.status(403).json({ success: false, error: 'SP can update only own service orders' });
    }

    if (role === 'COWORKER' && authUser?.spId !== orderData.spId) {
      return res.status(403).json({ success: false, error: 'Coworker can update only assigned SP orders' });
    }

    // Role permissions
    const roleAllowed: Record<string, string[]> = {
      SERVICE_PROVIDER: ['CONFIRMED', 'ASSIGNED_FOR_PICKUP', 'READY_FOR_DELIVERY', 'DELIVERED', 'PAID', 'COMPLETED'],
      COWORKER: ['CONFIRMED', 'READY_FOR_DELIVERY', 'DELIVERED'],
      CUSTOMER: ['CONFIRMED', 'PAID'],
    };

    const allowedForRole = roleAllowed[role] || [];
    if (!allowedForRole.includes(status)) {
      return res.status(403).json({ success: false, error: `${role} cannot set status ${status}` });
    }

    // Lifecycle constraints
    if (status === 'CONFIRMED' && role === 'CUSTOMER') {
      const creatorRole = orderData.createdByRole || orderData.createdBy || '';
      const createdByCustomer =
        creatorRole === 'CUSTOMER' ||
        (!!orderData.createdByUserId && orderData.createdByUserId === orderData.customerId);

      if (createdByCustomer) {
        return res.status(403).json({
          success: false,
          error: 'Customer cannot confirm orders created by customer. SP/Coworker must confirm.',
        });
      }
    }

    if (status === 'CONFIRMED') {
      const itemCount = Array.isArray(orderData.items) ? orderData.items.length : 0;
      if (itemCount === 0) {
        return res.status(400).json({ success: false, error: 'Order must contain at least one item before it can be confirmed' });
      }
    }

    if (status === 'ASSIGNED_FOR_PICKUP' && !selectedCoworker) {
      return res.status(400).json({ success: false, error: 'selectedCoworker is required for ASSIGNED_FOR_PICKUP' });
    }

    if (status === 'PAID' && orderData.status !== 'DELIVERED') {
      return res.status(400).json({ success: false, error: 'Order must be DELIVERED before PAID' });
    }

    if (status === 'COMPLETED' && orderData.status !== 'PAID') {
      return res.status(400).json({ success: false, error: 'Order must be PAID before COMPLETED' });
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
      lifecycleUpdatedBy: {
        uid: authUser?.uid,
        role,
      },
    };

    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
      updateData.isFrozen = true;
    }

    if (status === 'ASSIGNED_FOR_PICKUP') {
      updateData.selectedCoworker = selectedCoworker;
      updateData.assignedForPickupAt = new Date();
    }

    if (status === 'READY_FOR_DELIVERY') {
      updateData.readyForDeliveryAt = new Date();
    }

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    if (status === 'PAID') {
      updateData.paidAt = new Date();
      if (paymentProofUrl) {
        updateData.paymentProofUrl = paymentProofUrl;
      }
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    await orderRef.update(updateData);

    if (status === 'CONFIRMED') {
      await sendNotificationByEvent('ORDER_CONFIRMED', {
        orderId,
        spId: orderData.spId,
        customerId: orderData.customerId,
      });
    }

    if (status === 'COMPLETED') {
      await sendNotificationByEvent('ORDER_COMPLETED', {
        orderId,
        customerId: orderData.customerId,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        status,
      },
    });
  } catch (error: any) {
    logger.error('Update order lifecycle failed', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to update order lifecycle' });
  }
};

export const updateOrderDetails = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { items, specialInstructions, deliveryType, selectedCoworker, paymentMethod } = req.body || {};
    const authUser: any = (req as any).user;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const orderData: any = orderDoc.data() || {};
    const role = authUser?.role;

    if (!role || !['SERVICE_PROVIDER', 'COWORKER'].includes(role)) {
      return res.status(403).json({ success: false, error: 'Only SP/Coworker can edit order details' });
    }

    if (role === 'SERVICE_PROVIDER' && authUser?.uid !== orderData.spId) {
      return res.status(403).json({ success: false, error: 'SP can edit only own service orders' });
    }

    if (role === 'COWORKER' && authUser?.spId !== orderData.spId) {
      return res.status(403).json({ success: false, error: 'Coworker can edit only assigned SP orders' });
    }

    if (orderData.isFrozen || orderData.status === 'CONFIRMED' || orderData.status === 'READY_FOR_DELIVERY' || orderData.status === 'DELIVERED' || orderData.status === 'PAID' || orderData.status === 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Order cannot be edited after confirmation' });
    }

    const updateData: any = {
      updatedAt: new Date(),
      detailsUpdatedBy: {
        uid: authUser?.uid,
        role,
      },
    };

    if (Array.isArray(items)) {
      // Intermediate saves (edit-in-progress) may leave the order at 0 items - the SP/Coworker
      // is still assembling it. The at-least-one-item rule is enforced at confirm time instead.
      const normalizedItems = items
        .map((item: any) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          customPrice: Number(item.customPrice || item.price || 0),
          qty: Math.max(0, Number(item.qty || item.quantity || 0)),
        }))
        .filter((item: any) => item.qty > 0);

      const normalizedWithTotal = normalizedItems.map((item: any) => ({
        ...item,
        itemTotal: Number((item.customPrice * item.qty).toFixed(2)),
      }));

      const subtotal = Number(normalizedWithTotal.reduce((sum: number, item: any) => sum + item.itemTotal, 0).toFixed(2));
      const gst = orderData.applyGST ? Number(((subtotal * Number(orderData.gst || 0)) / Math.max(subtotal || 1, 1)).toFixed(2)) : 0;
      const total = Number((subtotal + gst).toFixed(2));

      updateData.items = normalizedWithTotal;
      updateData.subtotal = subtotal;
      updateData.total = total;
    }

    if (typeof specialInstructions === 'string') {
      updateData.specialInstructions = specialInstructions;
    }

    if (deliveryType === 'DROP' || deliveryType === 'PICKUP') {
      updateData.deliveryType = deliveryType;
    }

    if (typeof selectedCoworker === 'string') {
      updateData.selectedCoworker = selectedCoworker;
    }

    if (paymentMethod === 'ONLINE' || paymentMethod === 'DIRECT') {
      updateData.paymentMethod = paymentMethod;
    }

    await orderRef.update(updateData);

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        message: 'Order updated successfully',
      },
    });
  } catch (error: any) {
    logger.error('Update order details failed', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to update order details' });
  }
};

export const initializeOnlinePayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const authUser: any = (req as any).user;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const orderData: any = orderDoc.data() || {};

    if (authUser?.role !== 'CUSTOMER' || authUser?.uid !== orderData.customerId) {
      return res.status(403).json({ success: false, error: 'Only customer can initialize payment for this order' });
    }

    if (orderData.status !== 'DELIVERED') {
      return res.status(400).json({ success: false, error: 'Order must be DELIVERED before payment' });
    }

    if ((orderData.paymentMethod || 'DIRECT') !== 'ONLINE') {
      return res.status(400).json({ success: false, error: 'Online payment is not enabled for this order' });
    }

    const amountBase = Number(orderData.total || orderData.totalAmount || 0);
    const amount = Math.round(amountBase * 100);
    if (amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid payment amount for order' });
    }

    const razorpayOrder = await getRazorpayClient().orders.create({
      amount,
      currency: 'INR',
      receipt: orderId,
      notes: {
        orderId,
        customerId: String(orderData.customerId || ''),
      },
    });

    await orderRef.update({
      razorpayOrderId: razorpayOrder.id,
      paymentInitiatedAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount,
        currency: 'INR',
      },
    });
  } catch (error: any) {
    logger.error('Initialize online payment failed', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to initialize payment' });
  }
};

export const verifyOnlinePayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
    const authUser: any = (req as any).user;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, error: 'Missing required payment verification fields' });
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const orderData: any = orderDoc.data() || {};

    if (authUser?.role !== 'CUSTOMER' || authUser?.uid !== orderData.customerId) {
      return res.status(403).json({ success: false, error: 'Only customer can verify payment for this order' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, error: 'Razorpay secret is not configured' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    await orderRef.update({
      status: 'PAID',
      paymentMode: 'ONLINE_GATEWAY',
      razorpayOrderId,
      razorpayPaymentId,
      paymentVerifiedAt: new Date(),
      paidAt: new Date(),
      updatedAt: new Date(),
      lifecycleUpdatedBy: {
        uid: authUser?.uid,
        role: authUser?.role,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        status: 'PAID',
      },
    });
  } catch (error: any) {
    logger.error('Verify online payment failed', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to verify payment' });
  }
};
