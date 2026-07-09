// User Roles
export const USER_ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ACCOUNT_MANAGER: 'ACCOUNT_MANAGER',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  COWORKER: 'COWORKER',
  CUSTOMER: 'CUSTOMER',
} as const;

// Order Statuses
export const ORDER_STATUS = {
  CREATED: 'CREATED',
  CONFIRMED: 'CONFIRMED',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
} as const;

export const ORDER_STATUS_LABELS = {
  CREATED: 'Order Created',
  CONFIRMED: 'Confirmed',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  DELIVERED: 'Delivered',
  PAID: 'Payment Received',
  COMPLETED: 'Completed',
} as const;

// Service Provider Status
export const SP_STATUS = {
  CREATED: 'CREATED',
  ASSIGNED: 'ASSIGNED',
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

// Commission Types
export const COMMISSION_TYPE = {
  PER_ITEM: 'PER_ITEM',
  PERCENTAGE: 'PERCENTAGE',
} as const;

// Payment Modes
export const PAYMENT_MODE = {
  GATEWAY: 'GATEWAY',
  DIRECT_QR: 'DIRECT_QR',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_READY: 'ORDER_READY',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
} as const;

// Firebase Firestore Collections
export const COLLECTIONS = {
  SUPERADMINS: 'superadmins',
  ACCOUNT_MANAGERS: 'accountManagers',
  SERVICES: 'services',
  SERVICE_PROVIDERS: 'serviceProviders',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  NOTIFICATIONS: 'notifications',
  COMMISSION_TRACKING: 'commissionTracking',
  CUSTOMER_SP_LINKS: 'customerServiceProviderLinks',
  ORPHAN_REQUESTS: 'orphanRequests',
  PLATFORM_ANALYTICS: 'platformAnalytics',
} as const;

// Default Colors
export const DEFAULT_COLORS = {
  primary: '#3B82F6',
  secondary: '#1F2937',
  accent: '#F59E0B',
  primaryFont: '#000000',
  secondaryFont: '#6B7280',
} as const;

// Working Hours Default
export const WORKING_HOURS_DEFAULT = {
  monday: { start: '09:00', end: '18:00', open: true },
  tuesday: { start: '09:00', end: '18:00', open: true },
  wednesday: { start: '09:00', end: '18:00', open: true },
  thursday: { start: '09:00', end: '18:00', open: true },
  friday: { start: '09:00', end: '18:00', open: true },
  saturday: { start: '10:00', end: '16:00', open: true },
  sunday: { start: '10:00', end: '14:00', open: false },
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
} as const;

// API Timeout
export const API_TIMEOUT = 30000; // 30 seconds

// Routes
export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SUPERADMIN: {
    SERVICES: '/superadmin/services',
    SERVICE_DETAIL: '/superadmin/services/:serviceId',
    ACCOUNT_MANAGERS: '/superadmin/account-managers',
  },
  ACCOUNT_MANAGER: {
    DASHBOARD: '/account-manager/dashboard',
    SP_ONBOARDING: '/account-manager/onboarding/:spId',
    SP_LIST: '/account-manager/service-providers',
  },
  SERVICE_PROVIDER: {
    DASHBOARD: '/service-provider/dashboard',
    ORDERS: '/service-provider/orders',
    ORDER_DETAIL: '/service-provider/orders/:orderId',
    MENU: '/service-provider/menu',
    COWORKERS: '/service-provider/coworkers',
    ANALYTICS: '/service-provider/analytics',
  },
  CUSTOMER: {
    DASHBOARD: '/customer/dashboard',
    ORDERS: '/customer/orders',
    ORDER_DETAIL: '/customer/orders/:orderId',
    SERVICE_PROVIDERS: '/customer/service-providers',
    CREATE_ORDER: '/customer/create-order/:spId',
  },
} as const;

// Messages
export const MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  ERROR: 'Something went wrong',
  LOADING: 'Loading...',
  CONFIRM_DELETE: 'Are you sure you want to delete this item?',
  UNSAVED_CHANGES: 'You have unsaved changes. Are you sure you want to leave?',
} as const;
