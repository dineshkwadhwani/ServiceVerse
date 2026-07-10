// User & Auth Types
export type UserRole = 'SUPERADMIN' | 'ACCOUNT_MANAGER' | 'SERVICE_PROVIDER' | 'COWORKER' | 'CUSTOMER';

export interface BaseUser {
  uid: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuperAdmin extends BaseUser {
  role: 'SUPERADMIN';
}

export interface AccountManager extends BaseUser {
  role: 'ACCOUNT_MANAGER';
  service: {
    serviceId: string;
    serviceName: string;
  };
  managerId?: string; // For future hierarchy
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ServiceProvider extends BaseUser {
  role: 'SERVICE_PROVIDER';
  service: {
    serviceId: string;
    serviceName: string;
  };
  accountManager: {
    userId: string;
    name: string;
    email: string;
  };
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  gstNumber?: string;
  bankAccountDetails: BankDetails;
  businessLogo: string;
  workingHours: WorkingHours;
  status: 'CREATED' | 'ASSIGNED' | 'ONBOARDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  commission: CommissionConfig;
  upiQRCode?: string;
  onboardedAt?: Date;
}

export interface Coworker extends BaseUser {
  role: 'COWORKER';
  serviceProviderId: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Customer extends BaseUser {
  role: 'CUSTOMER';
  address?: string;
  city?: string;
  pin?: string;
  status: 'ACTIVE' | 'INACTIVE';
  verified: boolean;
  verifiedMethod?: 'email' | 'phone';
  isOrphaned: boolean; // true = can add multiple SPs, false = locked to one SP
  createdBySP?: string; // UID of SP who created this customer (if non-orphaned)
  createdAt: Date;
  updatedAt: Date;
}

// Service Types
export interface ColorTheme {
  primary: string;
  secondary: string;
  accent: string;
  primaryFontColor: string;
  secondaryFontColor: string;
}

export interface Service {
  serviceId: string;
  name: string;
  description: string;
  logo: string;
  heroImage: string;
  colorTheme: ColorTheme;
  fromEmail: string;
  fromName: string;
  gstPercentage: number;
  defaultCommission: CommissionConfig;
  status: 'ACTIVE' | 'INACTIVE';
  unorphanReasons: string[]; // Predefined reasons for customers to unorphan
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface MenuItem {
  menuItemId: string;
  name: string;
  description: string;
  basePrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SPMenuItem extends MenuItem {
  spPrice: number;
  isActive: boolean;
}

// Commission Types
export type CommissionType = 'PER_ITEM' | 'PERCENTAGE';

export interface CommissionConfig {
  type: CommissionType;
  value: number;
  active: boolean;
}

// Banking & Documents
export interface BankDetails {
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface WorkingHours {
  [key: string]: {
    start: string;
    end: string;
    open?: boolean;
  };
}

// Order Types
export type OrderStatus = 'CREATED' | 'CONFIRMED' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'PAID' | 'COMPLETED';

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  orderId: string;
  customerId: string;
  serviceProviderId: string;
  service: {
    serviceId: string;
    serviceName: string;
  };
  createdBy: 'CUSTOMER' | 'SERVICE_PROVIDER' | 'COWORKER';
  createdByUserId: string;
  status: OrderStatus;
  pickupDate: Date;
  pickupTime: string;
  items: OrderItem[];
  subtotal: number;
  gstApplicable: boolean;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
  invoice?: {
    invoiceNumber: string;
    generatedAt: Date;
    gstApplied: boolean;
  };
  paymentMode?: 'GATEWAY' | 'DIRECT_QR';
  commission?: {
    type: CommissionType;
    value: number;
    amount: number;
  };
  attachments?: Array<{
    type: 'IMAGE' | 'VIDEO';
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
  }>;
  feedback?: {
    rating: number;
    comment: string;
    createdAt: Date;
  };
  pickedUpByCoworkerId?: string;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  paymentReceivedAt?: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type PaymentMode = 'GATEWAY' | 'DIRECT_QR';

export interface Payment {
  paymentId: string;
  orderId: string;
  customerId: string;
  serviceProviderId: string;
  amount: number;
  commission: {
    type: CommissionType;
    value: number;
    amount: number;
  };
  amountToSP: number;
  status: PaymentStatus;
  mode: PaymentMode;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: 'UPI' | 'CARD' | 'NETBANKING';
  gstApplied: boolean;
  gstAmount: number;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
  bankTransferId?: string;
}

// Commission Tracking
export interface CommissionTracking {
  trackingId: string;
  serviceProviderId: string;
  service: {
    serviceId: string;
    serviceName: string;
  };
  orderId: string;
  amount: number;
  type: CommissionType;
  status: 'DUE' | 'PAID';
  paidAt?: Date;
  paymentMethod: PaymentMode;
  createdAt: Date;
  settledAt?: Date;
}

// Notification Types
export type NotificationType = 
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_READY'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_RECEIVED'
  | 'ORDER_COMPLETED';

export interface Notification {
  notificationId: string;
  userId: string;
  userRole: UserRole;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  channel: 'PUSH' | 'EMAIL';
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt: Date;
  createdAt: Date;
}

// Orphan Request
export interface OrphanRequest {
  requestId: string;
  customerId: string;
  currentServiceProviderId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: {
    userId: string;
    role: UserRole;
  };
  reviewedAt?: Date;
  createdAt: Date;
  notes?: string;
}

// Analytics Types
export interface PlatformAnalytics {
  analyticsId: string;
  service: {
    serviceId: string;
    serviceName: string;
  };
  date: Date;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  totalServiceProviders: number;
  activeCustomers: number;
  peakOrderTimes: Array<{
    hour: number;
    count: number;
  }>;
  repeatOrderPercentage: number;
  customerRetentionRate: number;
  averageOrderValue: number;
}

// Form Types
export interface CreateServiceFormData {
  name: string;
  description: string;
  logo: File;
  heroImage: File;
  colorTheme: ColorTheme;
  fromEmail: string;
  fromName: string;
  gstPercentage: number;
  defaultCommission: CommissionConfig;
}

export interface CreateMenuItemFormData {
  name: string;
  description: string;
  basePrice: number;
}

export interface OnboardSPFormData {
  businessName: string;
  ownerName: string;
  businessAddress: string;
  businessPhone: string;
  gstNumber?: string;
  gstCertificate?: File;
  bankAccountDetails: BankDetails;
  businessLogo: File;
  workingHours: WorkingHours;
  commission: CommissionConfig;
  coworkers?: Array<{
    name: string;
    phone: string;
    email: string;
  }>;
}

// User-Service Association
export interface UserServiceAssociation {
  associationId: string;
  userId: string;
  serviceId: string;
  role: 'SERVICE_PROVIDER' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE';
  joinedDate: Date;
  isActive: boolean;
  createdAt: Date;
}

// Unorphan Request
export type UnorphanStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UnorphanRequest {
  requestId: string;
  customerId: string;
  serviceId: string;
  currentSPId?: string; // If non-orphaned, the SP they want to unorphan from
  reason: string;
  status: UnorphanStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // UID of AM/SA who reviewed
  approvalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
