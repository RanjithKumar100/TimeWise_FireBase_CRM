const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  token?: string;
}

class ApiError extends Error {
  public statusCode: number;
  public response: ApiResponse;

  constructor(message: string, statusCode: number, response: ApiResponse) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('timewise-auth-token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('timewise-auth-token', token);
      } else {
        localStorage.removeItem('timewise-auth-token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new ApiError(data.message || 'Request failed', response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError(
        'Network error or server unavailable',
        0,
        { success: false, message: 'Network error', data: null }
      );
    }
  }

  // Authentication methods
  async login(username: string, password: string) {
    const response = await this.request<{ user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async register(name: string, email: string, password: string, role: 'Admin' | 'User' = 'User') {
    const response = await this.request<{ user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Work logs methods
  async getWorkLogs(params: {
    page?: number;
    limit?: number;
    verticle?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = `/worklogs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request<{ workLogs: any[]; pagination: any }>(endpoint);
  }

  async getWorkLog(id: string) {
    return this.request<{ workLog: any }>(`/worklogs/${id}`);
  }

  async createWorkLog(data: {
    date: string;
    verticle: string;
    country: string;
    task: string;
    hoursSpent: number;
  }) {
    return this.request<{ workLog: any }>('/worklogs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkLog(id: string, data: Partial<{
    date: string;
    verticle: string;
    country: string;
    task: string;
    hoursSpent: number;
  }>) {
    return this.request<{ workLog: any }>(`/worklogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkLog(id: string) {
    return this.request(`/worklogs/${id}`, {
      method: 'DELETE',
    });
  }

  // Users methods (Admin only)
  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = `/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request<{ users: any[]; pagination: any }>(endpoint);
  }

  async getUser(id: string) {
    return this.request<{ user: any; stats: any }>(`/users/${id}`);
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: 'Admin' | 'User';
    isActive?: boolean;
  }) {
    return this.request<{ user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<{
    name: string;
    email: string;
    password: string;
    role: 'Admin' | 'User';
    isActive: boolean;
  }>) {
    return this.request<{ user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Audit logs methods (Admin only)
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    performedByRole?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = `/audit-logs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request<{ auditLogs: any[]; pagination: any }>(endpoint);
  }

  // Development only - seed database
  async seedDatabase() {
    return this.request('/seed', {
      method: 'POST',
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export { ApiError };
export type { ApiResponse };