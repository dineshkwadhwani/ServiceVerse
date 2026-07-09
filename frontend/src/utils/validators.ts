import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Phone validation (Indian format)
export const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number');

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Service creation schema
export const createServiceSchema = z.object({
  name: z.string().min(2, 'Service name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  logo: z.instanceof(File).refine(file => file.size <= 5 * 1024 * 1024, 'Logo must be less than 5MB'),
  heroImage: z.instanceof(File).refine(file => file.size <= 5 * 1024 * 1024, 'Hero image must be less than 5MB'),
  colorTheme: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color'),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color'),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color'),
    primaryFontColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color'),
    secondaryFontColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color'),
  }),
  fromEmail: emailSchema,
  fromName: z.string().min(2, 'From name is required').max(100),
  gstPercentage: z.number().min(0).max(100),
  defaultCommission: z.object({
    type: z.enum(['PER_ITEM', 'PERCENTAGE']),
    value: z.number().min(0),
    active: z.boolean(),
  }),
});

// Menu item schema
export const menuItemSchema = z.object({
  name: z.string().min(2, 'Item name is required').max(100),
  description: z.string().min(5, 'Description is required').max(200),
  basePrice: z.number().min(0, 'Price must be positive'),
});

// Service Provider onboarding schema
export const spOnboardingSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  businessAddress: z.string().min(10, 'Address is required'),
  businessPhone: phoneSchema,
  gstNumber: z.string().optional(),
  gstCertificate: z.instanceof(File).optional(),
  bankAccountDetails: z.object({
    accountHolder: z.string().min(2, 'Account holder name is required'),
    accountNumber: z.string().min(9, 'Invalid account number'),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
    bankName: z.string().min(2, 'Bank name is required'),
  }),
  businessLogo: z.instanceof(File).refine(file => file.size <= 5 * 1024 * 1024, 'Logo must be less than 5MB'),
  workingHours: z.record(z.object({
    start: z.string(),
    end: z.string(),
    open: z.boolean().optional(),
  })),
  commission: z.object({
    type: z.enum(['PER_ITEM', 'PERCENTAGE']),
    value: z.number().min(0),
    active: z.boolean(),
  }),
});

// Create order schema
export const createOrderSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().min(1),
  })).min(1, 'At least one item is required'),
  pickupDate: z.string().refine(date => new Date(date) > new Date(), 'Pickup date must be in the future'),
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// OTP verification schema
export const otpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
});

// Helper functions
export function isValidEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

export function isValidPhone(phone: string): boolean {
  try {
    phoneSchema.parse(phone);
    return true;
  } catch {
    return false;
  }
}

export function isValidPassword(password: string): boolean {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
}

export function getValidationError(error: any): string {
  if (error instanceof z.ZodError) {
    return error.errors[0]?.message || 'Validation failed';
  }
  return 'Validation failed';
}
