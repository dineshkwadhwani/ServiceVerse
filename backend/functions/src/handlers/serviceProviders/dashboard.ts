import { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { resolveSpId } from '@/utils/spContext';

const logger = new Logger('SPDashboardHandlers');

const EARNING_STATUSES = new Set(['DELIVERED', 'COMPLETED', 'PAID']);

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getOrderSubtotal(orderData: any): number {
  if (typeof orderData?.subtotal === 'number') {
    return Number(orderData.subtotal) || 0;
  }

  const items = Array.isArray(orderData?.items) ? orderData.items : [];
  return items.reduce((sum: number, item: any) => {
    const qty = Number(item?.qty ?? item?.quantity ?? 0) || 0;
    const itemTotal = Number(item?.itemTotal);
    if (!Number.isNaN(itemTotal) && itemTotal > 0) return sum + itemTotal;
    const price = Number(item?.customPrice ?? item?.price ?? 0) || 0;
    return sum + qty * price;
  }, 0);
}

function getCommissionPerItemMap(spData: any): Record<string, number> {
  const map: Record<string, number> = {};
  const customMenus = spData?.customMenus || {};
  Object.values(customMenus).forEach((menuList: any) => {
    if (!Array.isArray(menuList)) return;
    menuList.forEach((item: any) => {
      if (!item?.menuItemId) return;
      const perItem = Number(item?.commissionPerItem);
      if (!Number.isNaN(perItem) && perItem >= 0) {
        map[item.menuItemId] = perItem;
      }
    });
  });
  return map;
}

function getCommissionAmount(orderData: any, spData: any, commissionPerItemMap: Record<string, number>): number {
  const subtotal = getOrderSubtotal(orderData);
  const commission = spData?.commission || {};

  if (commission?.type === 'PERCENTAGE') {
    const value = Number(commission?.value) || 0;
    if (value <= 0) return 0;
    return Number(((subtotal * value) / 100).toFixed(2));
  }

  if (commission?.type === 'FIXED') {
    const items = Array.isArray(orderData?.items) ? orderData.items : [];
    const total = items.reduce((sum: number, item: any) => {
      const qty = Number(item?.qty ?? item?.quantity ?? 0) || 0;
      const rate = Number(commissionPerItemMap[item?.menuItemId] || 0);
      return sum + qty * rate;
    }, 0);
    return Number(total.toFixed(2));
  }

  return 0;
}

function getOrderAmount(orderData: any): number {
  const total = Number(orderData?.total ?? orderData?.totalAmount ?? 0);
  if (!Number.isNaN(total) && total > 0) {
    return total;
  }
  return Number(getOrderSubtotal(orderData).toFixed(2));
}

async function getAssociatedCustomerIds(spId: string): Promise<Set<string>> {
  // 1) Direct link on customer docs (legacy + fast path)
  const directCustomersSnapshot = await db
    .collection('users')
    .where('createdBySP', '==', spId)
    .where('role', '==', 'CUSTOMER')
    .get();

  const customerIds = new Set<string>();

  directCustomersSnapshot.docs.forEach((doc) => {
    customerIds.add(doc.id);
  });

  // 2) Read association exactly from each customer's subcollection
  // to mirror how associations are written.
  const allCustomersSnapshot = await db
    .collection('users')
    .where('role', '==', 'CUSTOMER')
    .get();

  const associationChecks = await Promise.all(
    allCustomersSnapshot.docs
      .filter((customerDoc) => !customerIds.has(customerDoc.id))
      .map(async (customerDoc) => {
        const assocDocs = await customerDoc.ref
          .collection('serviceAssociations')
          .where('spId', '==', spId)
          .where('status', '==', 'ASSOCIATED')
          .limit(1)
          .get();

        return {
          customerId: customerDoc.id,
          isAssociated: !assocDocs.empty,
        };
      })
  );

  associationChecks.forEach((result) => {
    if (result.isAssociated) {
      customerIds.add(result.customerId);
    }
  });

  return customerIds;
}

/**
 * Create a customer from SP dashboard
 * SP sends email or phone, we create customer and send invitation
 */
export async function createCustomerBySP(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { email, phone } = req.body;

    if (!email && !phone) {
      return sendError(res, new ValidationError('Email or phone is required'));
    }

    const spId = req.user.uid;

    logger.info('SP creating customer', { spId, email, phone });

    // Determine contact method
    const contactMethod = email ? 'email' : 'phone';
    const contact = email || phone;

    // Check if customer already exists with this email/phone
    let existingUser = null;
    if (email) {
      const emailCheck = await db
        .collection('users')
        .where('email', '==', email)
        .where('role', '==', 'CUSTOMER')
        .limit(1)
        .get();
      existingUser = emailCheck.docs[0];
    } else {
      const phoneCheck = await db
        .collection('users')
        .where('phone', '==', phone)
        .where('role', '==', 'CUSTOMER')
        .limit(1)
        .get();
      existingUser = phoneCheck.docs[0];
    }

    if (existingUser) {
      return sendError(res, new ValidationError('Customer with this contact already exists'));
    }

    // Generate temporary password for initial login
    const tempPassword = Math.random().toString(36).substring(2, 15);

    // Create auth user
    const authUser = await auth.createUser({
      ...(email && { email }),
      ...(phone && { phoneNumber: `+91${phone}` }),
      password: tempPassword, // Temporary password, will verify OTP on first login
    });

    logger.info('Auth user created', { uid: authUser.uid });

    // Create user document (non-orphaned - linked to SP)
    const userData = {
      uid: authUser.uid,
      email: email || '',
      phone: phone || '',
      name: email || phone || 'Customer',
      role: 'CUSTOMER',
      verified: false,
      verifiedMethod: null,
      isOrphaned: false, // Non-orphaned: locked to this SP
      createdBySP: spId,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(authUser.uid).set(userData);

    logger.info('User document created for non-orphaned customer', { uid: authUser.uid });

    // Get SP details for the message
    const spDoc = await db.collection('users').doc(spId).get();
    const spData = spDoc.data();
    const spName = spData?.businessName || spData?.name || 'Service Provider';

    // TODO: Send email or SMS with invitation link and instructions
    // For now, just log it
    logger.info('Invitation should be sent to customer', {
      contact,
      method: contactMethod,
      message: `You've been added by ${spName}, download app and login to verify`,
    });

    return sendSuccess(res, {
      customerId: authUser.uid,
      contact,
      message: `Invitation sent to ${contact}`,
    }, 201);
  } catch (error: any) {
    logger.error('Failed to create customer', error);
    return sendError(res, error);
  }
}

/**
 * Get all customers associated with this SP
 * Combines direct links (createdBySP) and serviceAssociations links
 * to support both legacy and current association flows.
 */
export async function getSPCustomers(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const spId = resolveSpId(req.user);
    if (!spId) {
      return sendError(res, new ValidationError('Service Provider not authenticated'));
    }

    logger.info('Fetching SP customers', { spId });

    const customerIds = await getAssociatedCustomerIds(spId);

    const customerDocs = await Promise.all(
      Array.from(customerIds).map((customerId) => db.collection('users').doc(customerId).get())
    );

    const customers: any[] = customerDocs
      .filter((doc) => doc.exists && doc.data()?.role === 'CUSTOMER')
      .map((doc) => ({
        customerId: doc.id,
        name: doc.data()?.name,
        email: doc.data()?.email,
        phone: doc.data()?.phone,
        verified: doc.data()?.verified,
        addedAt: doc.data()?.createdAt,
      }));

    logger.info('SP customers fetched', { spId, count: customers.length });

    return sendSuccess(res, { customers });
  } catch (error: any) {
    logger.error('Failed to fetch SP customers', error);
    return sendError(res, error);
  }
}

/**
 * Get SP statistics (orders, revenue, rating, customer count)
 */
export async function getSPStats(req: AuthRequest, res: Response) {
  try {
    const spId = req.params.spId;
    if (!spId) {
      return sendError(res, new ValidationError('Service Provider ID is required'));
    }

    logger.info('Fetching SP stats', { spId });

    // Get SP data
    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    const spData = spDoc.data() || {};
    const associatedCustomerIds = await getAssociatedCustomerIds(spId);

    const ordersSnapshot = await db
      .collection('orders')
      .where('spId', '==', spId)
      .get();

    const commissionPerItemMap = getCommissionPerItemMap(spData);
    const totalEarnings = ordersSnapshot.docs.reduce((sum, doc) => {
      const orderData = doc.data() as any;
      const status = String(orderData?.status || '').toUpperCase();
      if (!EARNING_STATUSES.has(status)) return sum;

      const orderAmount = getOrderAmount(orderData);
      const commissionAmount = getCommissionAmount(orderData, spData, commissionPerItemMap);
      const net = Math.max(0, Number((orderAmount - commissionAmount).toFixed(2)));
      return sum + net;
    }, 0);

    // Calculate stats
    const stats = {
      totalOrders: spData.totalOrders || ordersSnapshot.size || 0,
      totalRevenue: Number(totalEarnings.toFixed(2)),
      totalEarnings: Number(totalEarnings.toFixed(2)),
      averageRating: spData.averageRating || 0,
      totalCustomers: associatedCustomerIds.size,
    };

    return sendSuccess(res, stats);
  } catch (error: any) {
    logger.error('Failed to fetch SP stats', error);
    return sendError(res, error);
  }
}

/**
 * Get SP earnings over time
 */
export async function getSPEarnings(req: AuthRequest, res: Response) {
  try {
    const spId = req.params.spId;
    if (!spId) {
      return sendError(res, new ValidationError('Service Provider ID is required'));
    }

    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    logger.info('Fetching SP earnings', { spId, startDate, endDate });

    const spDoc = await db.collection('users').doc(spId).get();
    if (!spDoc.exists) {
      return sendError(res, new ValidationError('Service Provider not found'));
    }

    const spData = spDoc.data() || {};
    const commissionPerItemMap = getCommissionPerItemMap(spData);

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start && Number.isNaN(start.getTime())) {
      return sendError(res, new ValidationError('Invalid startDate'));
    }
    if (end && Number.isNaN(end.getTime())) {
      return sendError(res, new ValidationError('Invalid endDate'));
    }

    const ordersSnapshot = await db
      .collection('orders')
      .where('spId', '==', spId)
      .get();

    const earnings = ordersSnapshot.docs
      .map((doc) => {
        const orderData = doc.data() as any;
        const status = String(orderData?.status || '').toUpperCase();
        if (!EARNING_STATUSES.has(status)) return null;

        const createdAt = toDate(orderData?.createdAt);
        if (!createdAt) return null;
        if (start && createdAt < start) return null;
        if (end) {
          const inclusiveEnd = new Date(end);
          inclusiveEnd.setHours(23, 59, 59, 999);
          if (createdAt > inclusiveEnd) return null;
        }

        const orderAmount = Number(getOrderAmount(orderData).toFixed(2));
        const commissionAmount = Number(
          getCommissionAmount(orderData, spData, commissionPerItemMap).toFixed(2)
        );
        const earningAmount = Number(Math.max(0, orderAmount - commissionAmount).toFixed(2));

        return {
          orderId: orderData?.orderId || doc.id,
          date: createdAt.toISOString(),
          customerName: orderData?.customerName || 'Unknown',
          orderAmount,
          commissionAmount,
          earningAmount,
          status,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalEarnings = Number(
      earnings.reduce((sum: number, row: any) => sum + Number(row.earningAmount || 0), 0).toFixed(2)
    );

    return sendSuccess(res, {
      earnings,
      totalEarnings,
    });
  } catch (error: any) {
    logger.error('Failed to fetch SP earnings', error);
    return sendError(res, error);
  }
}
