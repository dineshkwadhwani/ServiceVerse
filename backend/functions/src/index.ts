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
import * as spDashboardHandlers from '@/handlers/serviceProviders/dashboard';
import * as amDashboardHandlers from '@/handlers/accountManagers/dashboard';
import * as superAdminHandlers from '@/handlers/superAdmin/dashboard';
import * as diagnosticsHandlers from '@/handlers/debug/diagnostics';

import { getSeedAdminConfig, seedSuperAdminUser } from '@/handlers/admin/seedAdmin';


const logger = new Logger('CloudFunctions');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
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

// ============================================================================
// CUSTOMER DASHBOARD
// ============================================================================

app.get('/customers/services', async (req, res) => {
  customerHandlers.getCustomerServices(req as any, res);
});

app.get('/customers/search-providers', async (req, res) => {
  customerHandlers.searchServiceProviders(req as any, res);
});

app.post('/customers/add-provider', async (req, res) => {
  customerHandlers.addServiceProviderToCustomer(req as any, res);
});

app.post('/customers/request-unorphan', async (req, res) => {
  customerHandlers.requestUnorphan(req as any, res);
});

// ============================================================================
// SERVICE PROVIDER DASHBOARD
// ============================================================================

app.post('/service-providers/create-customer', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  spDashboardHandlers.createCustomerBySP(req as any, res);
});

app.get('/service-providers/customers', requireRole('SERVICE_PROVIDER'), async (req, res) => {
  spDashboardHandlers.getSPCustomers(req as any, res);
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
// PHASE 3: Orders & Payments
// ============================================================================

// Create Order
app.post('/orders', async (req, res) => {
  phase3Handlers.createOrder(req as any, res);
});

// Get Orders
app.get('/orders', async (req, res) => {
  phase3Handlers.getOrders(req as any, res);
});

// Get Order by ID
app.get('/orders/:orderId', async (req, res) => {
  phase3Handlers.getOrder(req as any, res);
});

// Confirm Order
app.patch('/orders/:orderId/confirm', async (req, res) => {
  phase3Handlers.confirmOrder(req as any, res);
});

// Mark Order Ready
app.patch('/orders/:orderId/mark-ready', requireRole('SERVICE_PROVIDER', 'COWORKER'), (req, res) => {
  phase3Handlers.markOrderReady(req as any, res);
});

// Mark Order Delivered
app.patch('/orders/:orderId/mark-delivered', requireRole('SERVICE_PROVIDER', 'COWORKER'), (req, res) => {
  phase3Handlers.markOrderDelivered(req as any, res);
});

// Initialize Razorpay Payment
app.post('/orders/:orderId/initialize-payment', async (req, res) => {
  phase3Handlers.initializeRazorpayPayment(req as any, res);
});

// Verify Razorpay Payment
app.post('/orders/:orderId/verify-payment', async (req, res) => {
  phase3Handlers.verifyRazorpayPayment(req as any, res);
});

// Confirm Direct Payment
app.patch('/orders/:orderId/confirm-direct-payment', async (req, res) => {
  phase3Handlers.confirmDirectPayment(req as any, res);
});

// Add Feedback
app.post('/orders/:orderId/feedback', async (req, res) => {
  phase3Handlers.addOrderFeedback(req as any, res);
});

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
