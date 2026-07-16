import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { verifyToken, requireRole } from '@/middleware/auth';
import { sendError, sendSuccess } from '@/middleware/errorHandler';
import { Logger } from '@/utils/logger';
import * as serviceHandlers from '@/handlers/services/createService';
import * as menuHandlers from '@/handlers/menu/menuOperations';
import * as phase2Handlers from '@/handlers/phase2/onboarding';
import * as phase3Handlers from '@/handlers/phase3/orders';

import * as authHandlers from '@/handlers/auth/registration';
import * as phoneSignInHandlers from '@/handlers/auth/phoneSignIn';
import * as customerHandlers from '@/handlers/customers/dashboard';
import * as customerProfileHandlers from '@/handlers/customers/profile';
import * as spDashboardHandlers from '@/handlers/serviceProviders/dashboard';
import * as createCustomerHandlers from '@/handlers/serviceProviders/createCustomer';
import * as spProfileHandlers from '@/handlers/serviceProviders/getSPProfile';
import * as spProfileUpdateHandlers from '@/handlers/serviceProviders/profileUpdate';
import * as amDashboardHandlers from '@/handlers/accountManagers/dashboard';
import * as amProfileHandlers from '@/handlers/accountManagers/profile';
import * as superAdminHandlers from '@/handlers/superAdmin/dashboard';
import * as superAdminProfileHandlers from '@/handlers/superAdmin/profile';
import * as diagnosticsHandlers from '@/handlers/debug/diagnostics';
import * as spMenuHandlers from '@/handlers/onboarding/spMenuSelection';
import * as spActivationHandlers from '@/handlers/onboarding/spActivation';
import * as completeOnboardingHandlers from '@/handlers/onboarding/completeOnboarding';
import * as spDataHandlers from '@/handlers/serviceProviders/updateData';
import * as customerSearchHandlers from '@/handlers/customers/search';
import * as ordersHandlers from '@/handlers/orders/createOrder';
import * as ordersListHandlers from '@/handlers/orders/getSPOrders';
import * as orderMenuHandlers from '@/handlers/orders/getSPMenu';
import * as coworkerHandlers from '@/handlers/coworkers/manage';
import * as coworkerProfileHandlers from '@/handlers/coworkers/profile';

import { getSeedAdminConfig, seedSuperAdminUser } from '@/handlers/admin/seedAdmin';


const logger = new Logger('CloudFunctions');

// Initialize Express app
const app = express();

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://serviceverse.vercel.app',
  'https://serviceverse-stage.vercel.app',
];

const configuredAllowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...defaultAllowedOrigins,
  ...configuredAllowedOrigins,
]);

const isServiceVerseVercelPreviewOrigin = (origin: string) =>
  /^https:\/\/serviceverse(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server and local tool requests with no Origin header.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin) || isServiceVerseVercelPreviewOrigin(origin)) {
      callback(null, true);
      return;
    }

    logger.warn('CORS blocked request', { origin });
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================================================
// PUBLIC ENDPOINTS (no authentication required)
// ============================================================================

// Services endpoints
app.get('/services', async (req, res) => {
  serviceHandlers.getServices(req as any, res);
});

app.get('/services/:serviceId', async (req, res) => {
  serviceHandlers.getService(req as any, res);
});

// Auth endpoints
app.post('/auth/send-email-otp', async (req, res) => {
  authHandlers.sendEmailOTP(req, res);
});

app.post('/auth/verify-email-otp', async (req, res) => {
  authHandlers.verifyEmailOTP(req, res);
});

app.post('/auth/send-phone-otp', async (req, res) => {
  authHandlers.sendPhoneOTP(req, res);
});

app.post('/auth/verify-phone-otp', async (req, res) => {
  authHandlers.verifyPhoneOTP(req, res);
});

app.post('/auth/complete-phone-signin', async (req, res) => {
  phoneSignInHandlers.completePhoneSignIn(req, res);
});

app.post('/auth/register-customer', async (req, res) => {
  authHandlers.registerCustomer(req, res);
});

app.post('/auth/register-sp', async (req, res) => {
  authHandlers.registerServiceProvider(req, res);
});

// Complete registration after phone verification (unified login/register endpoint)
app.post('/auth/complete-registration', verifyToken, async (req, res) => {
  authHandlers.completeRegistration(req, res);
});

// Auth middleware for all other routes
app.use(verifyToken);

app.post('/auth/register-push-token', async (req, res) => {
  authHandlers.registerPushToken(req, res);
});

// ============================================================================
// CUSTOMER DASHBOARD
// ============================================================================

app.get('/customers/services', async (req, res) => {
  customerHandlers.getCustomerServices(req as any, res);
});

app.get('/customers/search-providers', async (req, res) => {
  customerHandlers.searchServiceProviders(req as any, res);
});

app.get('/customers/service-providers', async (req, res) => {
  customerHandlers.getCustomerServiceProviders(req as any, res);
});

app.post('/customers/add-provider', async (req, res) => {
  customerHandlers.addServiceProviderToCustomer(req as any, res);
});

app.post('/customers/request-unorphan', async (req, res) => {
  customerHandlers.requestUnorphan(req as any, res);
});

app.get('/customers/search', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  customerSearchHandlers.searchCustomer(req as any, res);
});

app.get('/customers/:customerId/orders', requireRole('CUSTOMER', 'ACCOUNT_MANAGER', 'SUPERADMIN'), async (req, res) => {
  ordersListHandlers.getCustomerOrders(req as any, res);
});

app.patch('/customers/:userId/profile', requireRole('CUSTOMER'), async (req, res) => {
  customerProfileHandlers.updateCustomerProfile(req as any, res);
});

// ============================================================================
// ORDERS
// ============================================================================

app.post('/orders', requireRole('SERVICE_PROVIDER', 'CUSTOMER'), async (req, res) => {
  ordersHandlers.createOrder(req as any, res);
});

app.get('/orders/:orderId', requireRole('SERVICE_PROVIDER', 'CUSTOMER', 'COWORKER', 'ACCOUNT_MANAGER', 'SUPERADMIN'), async (req, res) => {
  ordersHandlers.getOrderById(req as any, res);
});

app.patch('/orders/:orderId/lifecycle', requireRole('SERVICE_PROVIDER', 'CUSTOMER', 'COWORKER'), async (req, res) => {
  ordersHandlers.updateOrderLifecycle(req as any, res);
});

app.patch('/orders/:orderId/details', requireRole('SERVICE_PROVIDER', 'COWORKER'), async (req, res) => {
  ordersHandlers.updateOrderDetails(req as any, res);
});

app.post('/orders/:orderId/initialize-payment', requireRole('CUSTOMER'), async (req, res) => {
  ordersHandlers.initializeOnlinePayment(req as any, res);
});

app.post('/orders/:orderId/verify-payment', requireRole('CUSTOMER'), async (req, res) => {
  ordersHandlers.verifyOnlinePayment(req as any, res);
});

app.get('/service-providers/:spId/orders', requireRole('SERVICE_PROVIDER', 'ACCOUNT_MANAGER'), async (req, res) => {
  ordersListHandlers.getSPOrders(req as any, res);
});

// ============================================================================
// SERVICE PROVIDER DASHBOARD
// ============================================================================

app.post('/service-providers/customers/search-phone', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  createCustomerHandlers.searchCustomerByPhone(req as any, res);
});

app.post('/service-providers/customers/create-new', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  createCustomerHandlers.createNewCustomerWithAssociation(req as any, res);
});

app.post('/service-providers/customers/associate', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  createCustomerHandlers.associateExistingCustomer(req as any, res);
});

app.get('/service-providers/customers', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  spDashboardHandlers.getSPCustomers(req as any, res);
});

// SP Profile Update (SP can update their own profile)
app.patch('/service-providers/profile', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  spProfileUpdateHandlers.updateSPProfile(req as any, res);
});

app.get('/service-providers/:spId/stats', requireRole('SERVICE_PROVIDER', 'ACCOUNT_MANAGER'), async (req, res) => {
  spDashboardHandlers.getSPStats(req as any, res);
});

app.get('/service-providers/:spId/earnings', requireRole('SERVICE_PROVIDER', 'ACCOUNT_MANAGER'), async (req, res) => {
  spDashboardHandlers.getSPEarnings(req as any, res);
});

// SP Coworker Management
app.post('/service-providers/:spId/coworkers', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  coworkerHandlers.createCoworker(req as any, res);
});

app.get('/service-providers/:spId/coworkers', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  coworkerHandlers.getSPCoworkers(req as any, res);
});

app.patch('/service-providers/:spId/coworkers/:coworkerId', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  coworkerHandlers.updateCoworkerStatus(req as any, res);
});

app.patch('/coworkers/:userId/profile', requireRole('COWORKER'), async (req, res) => {
  coworkerProfileHandlers.updateCoworkerProfile(req as any, res);
});

// SP Menu Management
app.get('/service-providers/menu/:serviceId', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  menuHandlers.getSPMenu(req as any, res);
});

app.patch('/service-providers/menu/:serviceId/items/:menuItemId', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  menuHandlers.updateSPMenuItem(req as any, res);
});

// Menu Item Requests (SP requesting, Admin approving)
app.post('/service-providers/menu-item-requests', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  menuHandlers.requestMenuItemCreation(req as any, res);
});

app.get('/admin/menu-item-requests/pending', requireRole('SUPERADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  menuHandlers.getPendingMenuItemRequests(req as any, res);
});

app.patch('/admin/menu-item-requests/:requestId/approve', requireRole('SUPERADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  menuHandlers.approveMenuItemRequest(req as any, res);
});

app.patch('/admin/menu-item-requests/:requestId/reject', requireRole('SUPERADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  menuHandlers.rejectMenuItemRequest(req as any, res);
});

app.get('/admin/menu-item-requests', requireRole('SUPERADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  menuHandlers.getMenuItemRequests(req as any, res);
});

// ============================================================================
// ACCOUNT MANAGER DASHBOARD
// ============================================================================

app.get('/account-managers/stats', requireRole('ACCOUNT_MANAGER'), async (req, res) => {
  amDashboardHandlers.getAMStats(req as any, res);
});

app.get('/account-managers/pending-onboarding', requireRole('ACCOUNT_MANAGER'), async (req, res) => {
  amDashboardHandlers.getAMPendingOnboarding(req as any, res);
});

app.get('/account-managers/unorphan-requests', requireRole('ACCOUNT_MANAGER'), async (req, res) => {
  amDashboardHandlers.getUnorphanRequests(req as any, res);
});

app.patch('/account-managers/unorphan-requests/:requestId', requireRole('ACCOUNT_MANAGER'), async (req, res) => {
  amDashboardHandlers.reviewUnorphanRequest(req as any, res);
});

app.patch('/account-managers/:userId/profile', requireRole('ACCOUNT_MANAGER'), async (req, res) => {
  amProfileHandlers.updateAMProfile(req as any, res);
});

// ============================================================================
// SUPERADMIN DASHBOARD
// ============================================================================

app.get('/superadmin/stats', requireRole('SUPERADMIN'), async (req, res) => {
  superAdminHandlers.getSystemStats(req as any, res);
});

app.get('/superadmin/users', requireRole('SUPERADMIN'), async (req, res) => {
  superAdminHandlers.getAllUsers(req as any, res);
});

app.post('/superadmin/users', requireRole('SUPERADMIN'), async (req, res) => {
  superAdminHandlers.createUser(req as any, res);
});

app.put('/superadmin/users/:userId', requireRole('SUPERADMIN'), async (req, res) => {
  superAdminHandlers.updateUser(req as any, res);
});

app.patch('/superadmin/:userId/profile', requireRole('SUPERADMIN'), async (req, res) => {
  superAdminProfileHandlers.updateSuperAdminProfile(req as any, res);
});

// ============================================================================
// PHASE 1: SuperAdmin - Services & Menu Management
// ============================================================================

// Create Service
app.post('/services', requireRole('SUPERADMIN'), (req, res) => {
  serviceHandlers.createService(req as any, res);
});

// Update Service
app.put('/services/:serviceId', requireRole('SUPERADMIN'), (req, res) => {
  serviceHandlers.updateService(req as any, res);
});

// Toggle Service Status
app.patch('/services/:serviceId/status', requireRole('SUPERADMIN'), (req, res) => {
  serviceHandlers.toggleServiceStatus(req as any, res);
});

// Menu Items - Master Menu (SuperAdmin/AccountManager)
app.post('/services/:serviceId/menu-items', requireRole('SUPERADMIN', 'ACCOUNT_MANAGER'), (req, res) => {
  menuHandlers.addMenuItem(req as any, res);
});

app.put('/services/:serviceId/menu-items/:menuItemId', requireRole('SUPERADMIN', 'ACCOUNT_MANAGER'), (req, res) => {
  menuHandlers.updateMenuItem(req as any, res);
});

app.get('/services/:serviceId/menu-items', (req, res) => {
  menuHandlers.getMenuItems(req as any, res);
});

// ============================================================================
// PHASE 2: AccountManager - ServiceProvider Onboarding
// ============================================================================

// Create AccountManager
app.post('/account-managers', requireRole('SUPERADMIN'), (req, res) => {
  phase2Handlers.createAccountManager(req as any, res);
});

// Get AccountManagers
app.get('/account-managers', requireRole('SUPERADMIN'), (req, res) => {
  phase2Handlers.getAccountManagers(req as any, res);
});

// Update AccountManager
app.put('/account-managers/:amId', requireRole('SUPERADMIN'), (req, res) => {
  phase2Handlers.updateAccountManager(req as any, res);
});

// Assign AccountManager to ServiceProvider
app.post('/service-providers/:spId/assign-account-manager', requireRole('SUPERADMIN'), (req, res) => {
  phase2Handlers.assignAccountManager(req as any, res);
});

// Onboard ServiceProvider
app.post('/service-providers/:spId/onboard', requireRole('ACCOUNT_MANAGER'), (req, res) => {
  phase2Handlers.onboardServiceProvider(req as any, res);
});

// Get ServiceProviders (for AccountManager)
app.get('/service-providers', requireRole('ACCOUNT_MANAGER'), (req, res) => {
  phase2Handlers.getServiceProviders(req as any, res);
});

// Get complete SP profile (for AM onboarding stepper)
app.get('/service-providers/:spId/profile', requireRole('ACCOUNT_MANAGER'), (req, res) => {
  spProfileHandlers.getSPProfile(req as any, res);
});

// SP Onboarding Workflow
// Get pending SP onboarding requests (SuperAdmin)
app.get('/sp-onboarding/pending', requireRole('SUPERADMIN'), (req, res) => {
  phase2Handlers.getPendingOnboardingRequests(req as any, res);
});

// Assign AM to SP (SuperAdmin)
app.post('/sp-onboarding/:requestId/assign-am', requireRole('SUPERADMIN'), (req, res) => {
  phase2Handlers.assignAccountManagerToSP(req as any, res);
});

// Get pending SPs for AM (AccountManager)
app.get('/sp-onboarding/my-pending', requireRole('ACCOUNT_MANAGER'), (req, res) => {
  phase2Handlers.getPendingSPsForAccountManager(req as any, res);
});

// Mark onboarding as complete (AccountManager)
app.post('/sp-onboarding/:requestId/complete', requireRole('ACCOUNT_MANAGER'), (req, res) => {
  phase2Handlers.markOnboardingComplete(req as any, res);
});

// ============================================================================
// PHASE 3: Orders & Payments (these are older handlers - phase 3 orders are deprecated)
// ============================================================================

// NOTE: Phase 3 handlers are deprecated. Use order endpoints above instead.

// ============================================================================
// Analytics
// ============================================================================

// Get Analytics
app.get('/analytics', async (req, res) => {
  try {
    logger.info('Fetching analytics');
    // TODO: Implement analytics
    sendSuccess(res, { analytics: {} });
  } catch (error) {
    sendError(res, error);
  }
});

// ============================================================================
// Error handling for 404
// ============================================================================

// ============================================================================
// DEBUG ENDPOINTS (for troubleshooting)
// ============================================================================

// Check SP assignment for an AM (no auth required for debugging)
app.get('/debug/check-sp-assignment', (req, res) => {
  diagnosticsHandlers.checkSPAssignment(req as any, res);
});

// ============================================================================
// SP MENU SELECTION (Onboarding)
// ============================================================================

// Get SP's service ID from their service associations
app.get('/service-providers/:spId/service-id', requireRole('ACCOUNT_MANAGER'), (req, res) => {
  spMenuHandlers.getSPServiceId(req as any, res);
});

// Get master menu for a service
app.get('/services/:serviceId/master-menu', (req, res) => {
  spMenuHandlers.getServiceMasterMenu(req as any, res);
});

// Save SP's selected menu items (during AM onboarding)
app.post('/service-providers/:spId/menu-selection', requireRole('ACCOUNT_MANAGER'), (req, res) => {
  spMenuHandlers.saveSPMenuSelection(req as any, res);
});

// Get SP's configured menu (for order creation)
app.get('/service-providers/:spId/menu', (req, res) => {
  orderMenuHandlers.getSPConfiguredMenu(req as any, res);
});

// ============================================================================
// SP DATA UPDATE (Consolidated - SP updates self, AM updates assigned SP)
// ============================================================================

// Must come BEFORE parameterized :spId routes to be matched correctly
app.post('/service-providers/update-data', requireRole('SERVICE_PROVIDER', 'ACCOUNT_MANAGER'), (req, res) => {
  spDataHandlers.updateSPData(req as any, res);
});

// ============================================================================
// SP COMPLETE ONBOARDING
// ============================================================================

// Complete SP onboarding (all 4 steps) - AccountManager only
app.post('/service-providers/:spId/onboarding/complete', requireRole('ACCOUNT_MANAGER'), (req, res) => {
  completeOnboardingHandlers.completeOnboarding(req as any, res);
});

// Update SP activation status (activate/inactivate) - AccountManager only
app.post('/service-providers/:spId/activation', requireRole('ACCOUNT_MANAGER'), (req, res) => {
  spActivationHandlers.updateSPActivationStatus(req as any, res);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// ============================================================================
// Export Cloud Function
// ============================================================================

export const api = functions
  .region('us-central1')
  .https.onRequest(app);

// Health check function
export const health = functions
  .region('us-central1')
  .https.onRequest((req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

/**
 * One-time / bootstrap endpoint to create the SuperAdmin user.
 * Protected by SEED_ADMIN_SECRET (header: x-seed-secret).
 */
export const seedAdmin = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, x-seed-secret');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    try {
      const config = getSeedAdminConfig();
      const providedSecret =
        req.get('x-seed-secret') || (req.body?.secret as string | undefined);

      if (!providedSecret || providedSecret !== config.secret) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const result = await seedSuperAdminUser({
        email: (req.body?.email as string | undefined) || config.email,
        password: (req.body?.password as string | undefined) || config.password,
        firstName: (req.body?.firstName as string | undefined) || config.firstName,
        lastName: (req.body?.lastName as string | undefined) || config.lastName,
        phone: (req.body?.phone as string | undefined) || config.phone,
      });

      res.status(200).json({
        success: true,
        data: {
          uid: result.uid,
          email: result.email,
          role: result.role,
          created: result.created,
          updated: result.updated,
        },
      });
    } catch (error: any) {
      logger.error('seedAdmin failed', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to seed SuperAdmin',
      });
    }
  });

logger.info('Cloud Functions initialized successfully');
