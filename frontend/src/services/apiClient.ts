import axios, { AxiosError, AxiosInstance } from 'axios';
import { auth } from '@/utils/firebase-config';

const API_URL = import.meta.env.VITE_API_URL;
const TIMEOUT = 30000;

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to attach auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<any>) => {
        const message = error.response?.data?.error || error.message || 'An error occurred';
        throw new Error(message);
      }
    );
  }

  // ============================================================================
  // AUTH & REGISTRATION
  // ============================================================================

  async sendEmailOTP(email: string) {
    return this.axiosInstance.post('/auth/send-email-otp', { email });
  }

  async verifyEmailOTP(email: string, otp: string) {
    const response = await this.axiosInstance.post('/auth/verify-email-otp', { email, otp });
    return (response as any)?.success === true;
  }

  async sendPhoneOTP(phone: string) {
    return this.axiosInstance.post('/auth/send-phone-otp', { phone });
  }

  async verifyPhoneOTP(phone: string, otp: string) {
    const response = await this.axiosInstance.post('/auth/verify-phone-otp', { phone, otp });
    return (response as any)?.success === true;
  }

  async registerCustomer(data: any) {
    return this.axiosInstance.post('/auth/register-customer', data);
  }

  async registerServiceProvider(data: any) {
    return this.axiosInstance.post('/auth/register-sp', data);
  }

  async completeRegistration(data: any) {
    return this.axiosInstance.post('/auth/complete-registration', data);
  }

  // ============================================================================
  // CUSTOMER DASHBOARD
  // ============================================================================

  async getCustomerServices() {
    return this.axiosInstance.get('/customers/services');
  }

  async searchServiceProviders(serviceId: string, query: string) {
    return this.axiosInstance.get('/customers/search-providers', {
      params: { serviceId, query },
    });
  }

  async addServiceProviderToCustomer(serviceId: string, spId: string) {
    return this.axiosInstance.post('/customers/add-provider', {
      serviceId,
      spId,
    });
  }

  async requestUnorphan(serviceId: string, reason: string) {
    return this.axiosInstance.post('/customers/request-unorphan', {
      serviceId,
      reason,
    });
  }

  async getServiceDetails(serviceId: string) {
    return this.axiosInstance.get(`/services/${serviceId}`);
  }

  // ============================================================================
  // SERVICE PROVIDER DASHBOARD
  // ============================================================================

  async createCustomerBySP(data: any) {
    return this.axiosInstance.post('/service-providers/create-customer', data);
  }

  async getSPCustomers() {
    return this.axiosInstance.get('/service-providers/customers');
  }

  // ============================================================================
  // ACCOUNT MANAGER DASHBOARD
  // ============================================================================

  async getAMStats() {
    return this.axiosInstance.get('/account-managers/stats');
  }

  async getAMPendingOnboarding() {
    return this.axiosInstance.get('/account-managers/pending-onboarding');
  }

  async getAMUnorphanRequests() {
    return this.axiosInstance.get('/account-managers/unorphan-requests');
  }

  async reviewUnorphanRequest(requestId: string, data: any) {
    return this.axiosInstance.patch(`/account-managers/unorphan-requests/${requestId}`, data);
  }

  // ============================================================================
  // SUPERADMIN DASHBOARD
  // ============================================================================

  async getSuperAdminStats() {
    return this.axiosInstance.get('/superadmin/stats');
  }

  async getAllUsers() {
    return this.axiosInstance.get('/superadmin/users');
  }

  async createUserByAdmin(data: any) {
    return this.axiosInstance.post('/superadmin/users', data);
  }

  async updateUserByAdmin(userId: string, data: any) {
    return this.axiosInstance.put(`/superadmin/users/${userId}`, data);
  }

  // ============================================================================
  // SERVICES
  // ============================================================================

  async createService(data: any) {
    return this.axiosInstance.post('/services', data);
  }

  async getServices(page = 1, limit = 10) {
    return this.axiosInstance.get('/services', {
      params: { page, limit },
    });
  }

  async getService(serviceId: string) {
    return this.axiosInstance.get(`/services/${serviceId}`);
  }

  async updateService(serviceId: string, data: any) {
    return this.axiosInstance.put(`/services/${serviceId}`, data);
  }

  async toggleServiceStatus(serviceId: string, status: 'ACTIVE' | 'INACTIVE') {
    return this.axiosInstance.patch(`/services/${serviceId}/status`, { status });
  }

  // ============================================================================
  // MENU ITEMS - MASTER MENU
  // ============================================================================

  async addMenuItem(serviceId: string, data: any) {
    return this.axiosInstance.post(`/services/${serviceId}/menu-items`, data);
  }

  async updateMenuItem(serviceId: string, menuItemId: string, data: any) {
    return this.axiosInstance.put(
      `/services/${serviceId}/menu-items/${menuItemId}`,
      data
    );
  }

  async getMenuItems(serviceId: string) {
    return this.axiosInstance.get(`/services/${serviceId}/menu-items`);
  }

  // ============================================================================
  // SERVICE PROVIDER MENU MANAGEMENT
  // ============================================================================

  async getSPMenu(serviceId: string) {
    return this.axiosInstance.get(`/service-providers/menu/${serviceId}`);
  }

  async updateSPMenuItem(serviceId: string, menuItemId: string, data: any) {
    return this.axiosInstance.patch(
      `/service-providers/menu/${serviceId}/items/${menuItemId}`,
      data
    );
  }

  // ============================================================================
  // MENU ITEM REQUESTS
  // ============================================================================

  async requestMenuItemCreation(serviceId: string, data: any) {
    return this.axiosInstance.post(`/service-providers/menu-item-requests`, {
      serviceId,
      ...data,
    });
  }

  async getPendingMenuItemRequests() {
    return this.axiosInstance.get('/admin/menu-item-requests/pending');
  }

  async approveMenuItemRequest(requestId: string) {
    return this.axiosInstance.patch(`/admin/menu-item-requests/${requestId}/approve`);
  }

  async rejectMenuItemRequest(requestId: string, reason?: string) {
    return this.axiosInstance.patch(`/admin/menu-item-requests/${requestId}/reject`, {
      rejectionReason: reason,
    });
  }

  async getMenuItemRequests(filters?: any) {
    return this.axiosInstance.get('/admin/menu-item-requests', { params: filters });
  }

  // ============================================================================
  // ACCOUNT MANAGERS
  // ============================================================================

  async createAccountManager(data: any) {
    return this.axiosInstance.post('/account-managers', data);
  }

  async getAccountManagers() {
    return this.axiosInstance.get('/account-managers');
  }

  async updateAccountManager(amId: string, data: any) {
    return this.axiosInstance.put(`/account-managers/${amId}`, data);
  }

  // ============================================================================
  // SERVICE PROVIDERS
  // ============================================================================

  async getServiceProviders() {
    return this.axiosInstance.get('/service-providers');
  }

  async assignAccountManager(spId: string, accountManagerId: string) {
    return this.axiosInstance.post(
      `/service-providers/${spId}/assign-account-manager`,
      { accountManagerId }
    );
  }

  async onboardServiceProvider(spId: string, data: any) {
    return this.axiosInstance.post(`/service-providers/${spId}/onboard`, data);
  }

  // ============================================================================
  // ORDERS
  // ============================================================================

  async createOrder(data: any) {
    return this.axiosInstance.post('/orders', data);
  }

  async getOrders(filters?: any) {
    return this.axiosInstance.get('/orders', { params: filters });
  }

  async getOrder(orderId: string) {
    return this.axiosInstance.get(`/orders/${orderId}`);
  }

  async confirmOrder(orderId: string, confirmedBy: string) {
    return this.axiosInstance.patch(`/orders/${orderId}/confirm`, { confirmedBy });
  }

  async markOrderReady(orderId: string, gstApplicable: boolean) {
    return this.axiosInstance.patch(`/orders/${orderId}/mark-ready`, {
      gstApplicable,
    });
  }

  async markOrderDelivered(orderId: string, attachments?: any[]) {
    return this.axiosInstance.patch(`/orders/${orderId}/mark-delivered`, {
      attachments,
    });
  }

  async addOrderFeedback(orderId: string, feedback: any) {
    return this.axiosInstance.post(`/orders/${orderId}/feedback`, feedback);
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================

  async initializeRazorpayPayment(orderId: string) {
    return this.axiosInstance.post(`/orders/${orderId}/initialize-payment`);
  }

  async verifyRazorpayPayment(orderId: string, paymentData: any) {
    return this.axiosInstance.post(`/orders/${orderId}/verify-payment`, paymentData);
  }

  async confirmDirectPayment(orderId: string) {
    return this.axiosInstance.patch(`/orders/${orderId}/confirm-direct-payment`);
  }

  // ============================================================================
  // SP ONBOARDING WORKFLOW
  // ============================================================================

  async getPendingOnboardingRequests() {
    return this.axiosInstance.get('/sp-onboarding/pending');
  }

  async assignAccountManagerToSP(requestId: string, accountManagerId: string) {
    return this.axiosInstance.post(`/sp-onboarding/${requestId}/assign-am`, {
      accountManagerId,
    });
  }

  async getPendingSPsForAccountManager() {
    return this.axiosInstance.get('/sp-onboarding/my-pending');
  }

  async markOnboardingComplete(requestId: string) {
    return this.axiosInstance.post(`/sp-onboarding/${requestId}/complete`);
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getAnalytics(filters?: any) {
    return this.axiosInstance.get('/analytics', { params: filters });
  }

  async getPlatformAnalytics(startDate?: string, endDate?: string) {
    return this.axiosInstance.get('/analytics/platform', {
      params: { startDate, endDate },
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for testing/mocking
export default ApiClient;
