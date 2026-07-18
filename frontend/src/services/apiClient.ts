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

  async registerPushToken(token: string) {
    return this.axiosInstance.post('/auth/register-push-token', { token });
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

  async getCustomerServiceProviders(serviceId: string) {
    return this.axiosInstance.get('/customers/service-providers', {
      params: { serviceId },
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

  async searchCustomerByPhone(phone: string) {
    return this.axiosInstance.post('/service-providers/customers/search-phone', { phone });
  }

  async createNewCustomerWithAssociation(data: { phone: string; name: string; address: string; email?: string }) {
    return this.axiosInstance.post('/service-providers/customers/create-new', data);
  }

  async associateExistingCustomer(customerId: string) {
    return this.axiosInstance.post('/service-providers/customers/associate', { customerId });
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

  async getSuperAdminEarnings(params?: { city?: string; serviceProviderId?: string; month?: string }) {
    return this.axiosInstance.get('/superadmin/earnings', { params });
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

  async getSPProfile(spId: string) {
    return this.axiosInstance.get(`/service-providers/${spId}/profile`);
  }

  async updateSPProfile(basicInfo: any, operations: any) {
    return this.axiosInstance.patch(`/service-providers/profile`, {
      basicInfo,
      operations,
    });
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

  async updateOrderLifecycle(orderId: string, data: { status: string; selectedCoworker?: string; paymentProofUrl?: string }) {
    return this.axiosInstance.patch(`/orders/${orderId}/lifecycle`, data);
  }

  async updateOrderDetails(orderId: string, data: { items?: any[]; specialInstructions?: string; deliveryType?: string; selectedCoworker?: string; paymentMethod?: string }) {
    return this.axiosInstance.patch(`/orders/${orderId}/details`, data);
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
  // MENU SELECTION (Onboarding)
  // ============================================================================

  async getSPServiceId(spId: string) {
    return this.axiosInstance.get(`/service-providers/${spId}/service-id`);
  }

  async getServiceMenuItems(serviceId: string) {
    return this.axiosInstance.get(`/services/${serviceId}/master-menu`);
  }

  async saveSPMenuSelection(spId: string, serviceId: string, menuItems: any[]) {
    return this.axiosInstance.post(`/service-providers/${spId}/menu-selection`, {
      spId,
      serviceId,
      menuItems,
    });
  }

  async getSPConfiguredMenu(spId: string) {
    return this.axiosInstance.get(`/service-providers/${spId}/menu`);
  }

  async completeOnboarding(spId: string, data: any) {
    return this.axiosInstance.post(`/service-providers/${spId}/onboarding/complete`, data);
  }

  async updateSPActivationStatus(spId: string, activate: boolean) {
    return this.axiosInstance.post(`/service-providers/${spId}/activation`, { activate });
  }

  async updateSPData(spId: string, data: any) {
    return this.axiosInstance.post('/service-providers/update-data', { spId, ...data });
  }

  // ============================================================================
  // SERVICE PROVIDER DASHBOARD
  // ============================================================================

  async getSPStats(spId: string): Promise<any> {
    try {
      return await this.axiosInstance.get(`/service-providers/${spId}/stats`);
    } catch (error) {
      return { totalOrders: 0, totalRevenue: 0, averageRating: 0, totalCustomers: 0 };
    }
  }

  async getSPOrders(spId: string): Promise<any> {
    try {
      return await this.axiosInstance.get(`/service-providers/${spId}/orders`);
    } catch (error) {
      return { orders: [] };
    }
  }

  async getSPEarnings(spId: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      return await this.axiosInstance.get(`/service-providers/${spId}/earnings`, {
        params: { startDate, endDate },
      });
    } catch (error) {
      return { earnings: [] };
    }
  }

  async getSPCustomers(): Promise<any> {
    try {
      return await this.axiosInstance.get(`/service-providers/customers`);
    } catch (error) {
      return { customers: [] };
    }
  }

  async searchCustomer(phone: string): Promise<any> {
    return this.axiosInstance.get('/customers/search', { params: { phone } });
  }

  async getSPOrdersList(spId: string, limit?: number, startAfter?: string): Promise<any> {
    return this.axiosInstance.get(`/service-providers/${spId}/orders`, {
      params: { limit, startAfter },
    });
  }

  async getCustomerOrdersList(customerId: string, limit?: number, startAfter?: string): Promise<any> {
    return this.axiosInstance.get(`/customers/${customerId}/orders`, {
      params: { limit, startAfter },
    });
  }

  // ============================================================================
  // COWORKERS
  // ============================================================================

  async createCoworker(spId: string, data: { phone: string; name: string; status: string }): Promise<any> {
    return this.axiosInstance.post(`/service-providers/${spId}/coworkers`, data);
  }

  async getSPCoworkers(spId: string): Promise<any> {
    try {
      return await this.axiosInstance.get(`/service-providers/${spId}/coworkers`);
    } catch (error) {
      return { coworkers: [] };
    }
  }

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  async updateCustomerProfile(userId: string, data: any) {
    return this.axiosInstance.patch(`/customers/${userId}/profile`, data);
  }

  async updateAMProfile(userId: string, data: any) {
    return this.axiosInstance.patch(`/account-managers/${userId}/profile`, data);
  }

  async updateCoworkerProfile(userId: string, data: any) {
    return this.axiosInstance.patch(`/coworkers/${userId}/profile`, data);
  }

  async updateSuperAdminProfile(userId: string, data: any) {
    return this.axiosInstance.patch(`/superadmin/${userId}/profile`, data);
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
