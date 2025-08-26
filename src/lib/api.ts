// Function to get the correct API base URL
function getApiBaseUrl(): string {
  // First, check environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // On client side, try to detect the current host
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // If accessing via IP or network address, use the same for API
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:9002`;
    }
  }
  
  // Fallback to localhost for development
  return 'http://localhost:9002';
}

const API_BASE_URL = getApiBaseUrl();

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
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('timewise-auth-token');
    }
  }

  // Get base URL dynamically to handle network changes
  private getBaseUrl(): string {
    return getApiBaseUrl();
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
    const url = `${this.getBaseUrl()}/api${endpoint}`;
    
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
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new ApiError(data.message || 'Request failed', response.status, data);
      }

      return data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle different types of network errors
      let errorMessage = 'Network error or server unavailable';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - server may be slow or unavailable';
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
        errorMessage = `Cannot connect to server at ${url}. Make sure the server is running on port 9002.`;
      }
      
      console.error('API Request Failed:', {
        url,
        error: error.message,
        type: error.name
      });
      
      // Network or other errors
      throw new ApiError(
        errorMessage,
        0,
        { success: false, message: errorMessage, data: null }
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