import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// API Gateway URL (tất cả requests đi qua gateway)
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000');

// Mock mode - set to true when backend is not running
const MOCK_MODE = (import.meta.env.VITE_MOCK_MODE === 'true' || false); // Changed to false to use real API

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Generic API Response type
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export { MOCK_MODE };
export default apiClient;
