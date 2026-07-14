import { Request, Response } from 'express';
import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';

const logger = new Logger('CreateOrder');

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

    // Validation
    if (!data.spId || !data.customerId || !data.customerPhone || !data.items || data.items.length === 0) {
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

    // Verify SP exists
    const spDoc = await db.collection('users').doc(data.spId).get();
    if (!spDoc.exists || spDoc.data()?.role !== 'SERVICE_PROVIDER') {
      return res.status(404).json({
        success: false,
        error: 'Service Provider not found',
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
      items: data.items,
      subtotal: data.subtotal,
      gst: data.gst,
      total: data.total,
      applyGST: data.applyGST,
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
