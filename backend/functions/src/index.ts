import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import { verifyToken, requireRole } from '@/middleware/auth';
import { sendError, sendSuccess } from '@/middleware/errorHandler';
import { Logger } from '@/utils/logger';
import * as serviceHandlers from '@/handlers/services/createService';
import * as phase2Handlers from '@/handlers/phase2/onboarding';
import * as phase3Handlers from '@/handlers/phase3/orders';

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

// Auth middleware for all other routes
app.use(verifyToken);

// ============================================================================
// PHASE 1: SuperAdmin - Services & Menu Management
// ============================================================================

// Create Service
app.post('/services', requireRole('SUPERADMIN'), (req, res) => {
  serviceHandlers.createService(req as any, res);
});

// Get Services
app.get('/services', async (req, res) => {
  serviceHandlers.getServices(req as any, res);
});

// Get Service by ID
app.get('/services/:serviceId', async (req, res) => {
  serviceHandlers.getService(req as any, res);
});

// Update Service
app.put('/services/:serviceId', requireRole('SUPERADMIN'), (req, res) => {
  serviceHandlers.updateService(req as any, res);
});

// Toggle Service Status
app.patch('/services/:serviceId/status', requireRole('SUPERADMIN'), (req, res) => {
  serviceHandlers.toggleServiceStatus(req as any, res);
});

// Add Menu Item
app.post('/services/:serviceId/menu-items', requireRole('SUPERADMIN'), (req, res) => {
  serviceHandlers.addMenuItem(req as any, res);
});

// Update Menu Item
app.put('/services/:serviceId/menu-items/:menuItemId', requireRole('SUPERADMIN'), (req, res) => {
  serviceHandlers.updateMenuItem(req as any, res);
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

logger.info('Cloud Functions initialized successfully');
