import axios, { AxiosError, AxiosInstance } from 'axios';
import { auth } from '@/utils/firebase-config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/us-central1/serviceverse';
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
        try {
          const token = await auth.currentUser?.getIdToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Failed to get auth token:', error);
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
  // MENU ITEMS
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

  async registerServiceProvider(data: any) {
    return this.axiosInstance.post('/service-providers/register', data);
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

  async getServiceProviders() {
    return this.axiosInstance.get('/service-providers');
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
