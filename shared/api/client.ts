// API Client for communicating with PizzaFlow Server
import { getApiUrl } from '../config/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Network error',
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string, role?: string) {
    const response = await this.request<{ token: string; user: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      }
    );
    this.setToken(response.token);
    return response;
  }

  async register(email: string, password: string, name: string, phone?: string) {
    const response = await this.request<{ token: string; user: any }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, name, phone }),
      }
    );
    this.setToken(response.token);
    return response;
  }

  async verifyToken() {
    return this.request<{ valid: boolean; user: any }>('/auth/verify');
  }

  logout() {
    this.setToken(null);
  }

  // Orders
  async getOrders() {
    return this.request('/orders');
  }

  async getOrder(orderId: string) {
    return this.request(`/orders/${orderId}`);
  }

  async getRiderOrders(riderId: string) {
    return this.request(`/orders/rider/${riderId}`);
  }

  async getCustomerOrdersById(customerId: string) {
    return this.request(`/orders/customer/${customerId}`);
  }

  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async assignOrderToRider(orderId: string, riderId: string) {
    return this.request(`/orders/${orderId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ riderId }),
    });
  }

  // Menu
  async getMenuItems() {
    return this.request('/menu/items');
  }

  async getMenuItem(id: number) {
    return this.request(`/menu/items/${id}`);
  }

  async getMenuItemsByCategory(category: string) {
    return this.request(`/menu/items/category/${category}`);
  }

  async getMenuCategories() {
    return this.request('/menu/categories');
  }

  // Riders
  async getRiders() {
    return this.request('/riders');
  }

  async getAvailableRiders() {
    return this.request('/riders/available');
  }

  async getRider(id: string) {
    return this.request(`/riders/${id}`);
  }

  async updateRiderStatus(id: string, status: string) {
    return this.request(`/riders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Batches
  async getBatches() {
    return this.request('/batches');
  }

  async getBatch(id: string) {
    return this.request(`/batches/${id}`);
  }

  async getRiderBatches(riderId: string) {
    return this.request(`/batches/rider/${riderId}`);
  }

  // Admin
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  // Customer
  async getCustomerOrders() {
    return this.request('/customer/orders');
  }

  async getCustomerMenu() {
    return this.request('/customer/menu');
  }

  async createCustomerOrder(orderData: any) {
    return this.request('/customer/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;



