import { db, auth } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import { ValidationError, sendError, sendSuccess } from '@/middleware/errorHandler';
import type { AuthRequest } from '@/middleware/auth';
import type { Response } from 'express';

const logger = new Logger('SuperAdminDashboardHandlers');

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
  if (!Number.isNaN(total) && total > 0) return total;
  return Number(getOrderSubtotal(orderData).toFixed(2));
}

/**
 * Get system statistics
 */
export async function getSystemStats(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Fetching system stats');

    // Count total users by role
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    const roleCount = {
      ACCOUNT_MANAGER: 0,
      SERVICE_PROVIDER: 0,
      CUSTOMER: 0,
      COWORKER: 0,
    };

    usersSnapshot.docs.forEach((doc) => {
      const role = doc.data().role;
      if (role in roleCount) {
        roleCount[role as keyof typeof roleCount]++;
      }
    });

    // Count total services
    const servicesSnapshot = await db.collection('services').get();
    const totalServices = servicesSnapshot.size;

    const spUsersSnapshot = await db
      .collection('users')
      .where('role', '==', 'SERVICE_PROVIDER')
      .get();

    const spMap = new Map<string, any>();
    const commissionMapBySp = new Map<string, Record<string, number>>();
    spUsersSnapshot.docs.forEach((doc) => {
      const data = doc.data() || {};
      spMap.set(doc.id, data);
      commissionMapBySp.set(doc.id, getCommissionPerItemMap(data));
    });

    const ordersSnapshot = await db
      .collection('orders')
      .where('status', 'in', Array.from(EARNING_STATUSES))
      .get();

    const totalCommission = Number(
      ordersSnapshot.docs
        .reduce((sum, doc) => {
          const orderData = doc.data() as any;
          const spData = spMap.get(orderData?.spId) || {};
          const perItemMap = commissionMapBySp.get(orderData?.spId) || {};
          return sum + getCommissionAmount(orderData, spData, perItemMap);
        }, 0)
        .toFixed(2)
    );

    return sendSuccess(res, {
      totalUsers,
      totalServices,
      totalAccountManagers: roleCount.ACCOUNT_MANAGER,
      totalServiceProviders: roleCount.SERVICE_PROVIDER,
      totalCustomers: roleCount.CUSTOMER,
      totalEarnings: totalCommission,
    });
  } catch (error: any) {
    logger.error('Failed to fetch system stats', error);
    return sendError(res, error);
  }
}

/**
 * Get earnings report for SuperAdmin
 * Filters: city, serviceProviderId, month (YYYY-MM)
 */
export async function getEarningsReport(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { city, serviceProviderId, month } = req.query as {
      city?: string;
      serviceProviderId?: string;
      month?: string;
    };

    logger.info('Fetching super admin earnings report', { city, serviceProviderId, month });

    const spUsersSnapshot = await db
      .collection('users')
      .where('role', '==', 'SERVICE_PROVIDER')
      .get();

    const spMap = new Map<string, any>();
    const commissionMapBySp = new Map<string, Record<string, number>>();
    const citySet = new Set<string>();

    spUsersSnapshot.docs.forEach((doc) => {
      const data = doc.data() || {};
      spMap.set(doc.id, data);
      commissionMapBySp.set(doc.id, getCommissionPerItemMap(data));
      if (data?.city) citySet.add(String(data.city));
    });

    const monthStart = month ? new Date(`${month}-01T00:00:00.000Z`) : null;
    const monthEnd = monthStart
      ? new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0, 23, 59, 59, 999))
      : null;

    if (month && (!monthStart || Number.isNaN(monthStart.getTime()))) {
      return sendError(res, new ValidationError('Invalid month format. Use YYYY-MM'));
    }

    const ordersSnapshot = await db
      .collection('orders')
      .where('status', 'in', Array.from(EARNING_STATUSES))
      .get();

    const normalizedCity = (city || '').trim().toLowerCase();

    const earnings = ordersSnapshot.docs
      .map((doc) => {
        const orderData = doc.data() as any;
        const spId = orderData?.spId;
        if (!spId) return null;

        const spData = spMap.get(spId) || {};
        const spCity = String(spData?.city || '').trim();

        if (serviceProviderId && spId !== serviceProviderId) return null;
        if (normalizedCity && spCity.toLowerCase() !== normalizedCity) return null;

        const createdAt = toDate(orderData?.createdAt);
        if (!createdAt) return null;
        if (monthStart && monthEnd && (createdAt < monthStart || createdAt > monthEnd)) return null;

        const orderAmount = Number(getOrderAmount(orderData).toFixed(2));
        const commissionAmount = Number(
          getCommissionAmount(orderData, spData, commissionMapBySp.get(spId) || {}).toFixed(2)
        );
        const earningAmount = Number(Math.max(0, orderAmount - commissionAmount).toFixed(2));

        return {
          orderId: orderData?.orderId || doc.id,
          date: createdAt.toISOString(),
          customerName: orderData?.customerName || 'Unknown',
          orderAmount,
          commissionAmount,
          earningAmount,
          spId,
          serviceProviderName: spData?.businessName || spData?.name || 'Service Provider',
          city: spCity,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalOrderAmount = Number(
      earnings.reduce((sum: number, row: any) => sum + Number(row.orderAmount || 0), 0).toFixed(2)
    );
    const totalCommissionAmount = Number(
      earnings.reduce((sum: number, row: any) => sum + Number(row.commissionAmount || 0), 0).toFixed(2)
    );
    const totalEarningAmount = Number(
      earnings.reduce((sum: number, row: any) => sum + Number(row.earningAmount || 0), 0).toFixed(2)
    );

    const serviceProviders = spUsersSnapshot.docs
      .map((doc) => {
        const data = doc.data() || {};
        return {
          spId: doc.id,
          name: data?.businessName || data?.name || 'Service Provider',
          city: data?.city || '',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return sendSuccess(res, {
      earnings,
      totals: {
        totalOrderAmount,
        totalCommissionAmount,
        totalEarningAmount,
      },
      filters: {
        cities: Array.from(citySet).sort(),
        serviceProviders,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch super admin earnings report', error);
    return sendError(res, error);
  }
}

/**
 * Get all users
 */
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    logger.info('Fetching all users');

    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();

    const users = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        status: data.status || 'ACTIVE',
        verified: data.verified || false,
        businessName: data.role === 'SERVICE_PROVIDER' ? data.businessName || '' : undefined,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      };
    });

    return sendSuccess(res, { users });
  } catch (error: any) {
    logger.error('Failed to fetch users', error);
    return sendError(res, error);
  }
}

/**
 * Create a new user (Account Manager or Service Provider)
 */
export async function createUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, new ValidationError('User not authenticated'));
    }

    const { name, email, phone, role } = req.body;

    if (!name || !email || !role) {
      return sendError(res, new ValidationError('Name, email, and role are required'));
    }

    if (!['ACCOUNT_MANAGER', 'SERVICE_PROVIDER', 'CUSTOMER'].includes(role)) {
      return sendError(res, new ValidationError('Invalid role'));
    }

    logger.info('Creating new user', { name, email, role });

    // Check if email already exists
    const existingEmail = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingEmail.empty) {
      return sendError(res, new ValidationError('Email already in use'));
    }

    // Create Firebase Auth user with a temporary password
    const tempPassword = Math.random().toString(36).slice(-12);

    const authUser = await auth.createUser({
      email,
      password: tempPassword,
      displayName: name,
    });

    // Create user document in Firestore
    await db.collection('users').doc(authUser.uid).set({
      uid: authUser.uid,
      name,
      email,
      phone: phone || null,
      role,
      verified: false,
      verifiedMethod: null,
      isOrphaned: role === 'CUSTOMER' ? true : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.uid,
    });

    // Set custom claims
    await auth.setCustomUserClaims(authUser.uid, { role });

    logger.info('User created successfully', { uid: authUser.uid, role });

    // TODO: Send email with login credentials and password reset link

    return sendSuccess(res, {
      userId: authUser.uid,
      email,
      name,
      role,
      tempPassword: '***', // Don't return actual password
      message: `User created. Send them a password reset link to complete registration.`,
    });
  } catch (error: any) {
    logger.error('Failed to create user', error);
    return sendError(res, error);
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { name, email, phone, status, businessName } = req.body;

    if (!userId) {
      return sendError(res, new ValidationError('User ID is required'));
    }

    logger.info('Updating user', { userId, name, email, phone, status });

    // Get current user
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return sendError(res, new ValidationError('User not found'));
    }

    const currentUser = userSnap.data() as any;

    // Update Firestore document
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;
    if (currentUser?.role === 'SERVICE_PROVIDER' && businessName !== undefined) {
      updateData.businessName = businessName;
    }
    // Email is optional (phone is the primary auth method) - only touch Firebase
    // Auth/Firestore email when a non-empty value is actually provided and changed.
    if (email && currentUser && email !== currentUser.email) {
      await auth.updateUser(userId, { email });
      updateData.email = email;
    }

    await userRef.update(updateData);

    logger.info('User updated successfully', { userId });

    return sendSuccess(res, {
      userId,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update user', error);
    return sendError(res, error);
  }
}
