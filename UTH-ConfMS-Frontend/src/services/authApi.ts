import apiClient, { ApiResponse } from './apiClient';

// --- DTOs (Data Transfer Objects) ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string; // Khớp với backend .NET
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  // SỬA QUAN TRỌNG: Backend trả về key là "roles" (số nhiều), không phải "role"
  roles: string[]; 
  avatarUrl?: string;
  institution?: string;
  createdAt: string;
}

// --- Auth API Service ---

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    // Gọi thẳng vào API Gateway
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<UserDto>> => {
    const response = await apiClient.post<ApiResponse<UserDto>>('/api/auth/register', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (e) {
      // Bỏ qua lỗi khi logout (fire and forget)
      console.error('Logout error', e);
    }
  },

  getProfile: async (): Promise<ApiResponse<UserDto>> => {
    const response = await apiClient.get<ApiResponse<UserDto>>('/api/auth/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<UserDto>): Promise<ApiResponse<UserDto>> => {
    const response = await apiClient.put<ApiResponse<UserDto>>('/api/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/api/auth/change-password', data);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/api/auth/forgot-password', { email });
    return response.data;
  },

  // --- Role Context API (Multi-role support) ---
  getAvailableContexts: async (conferenceId?: string): Promise<ApiResponse<any>> => {
    const params = conferenceId ? { conferenceId } : {};
    const response = await apiClient.get<ApiResponse<any>>('/api/rolecontext/contexts', { params });
    return response.data;
  },

  switchRoleContext: async (conferenceId: string, roleName: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/api/rolecontext/switch', {
      conferenceId,
      roleName
    });
    return response.data;
  },

  getCurrentContext: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>('/api/rolecontext/current');
    return response.data;
  },

  // --- Notification API ---
  getNotifications: async (page = 1, pageSize = 20): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>('/api/notifications', {
      params: { page, pageSize }
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>('/api/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.put<ApiResponse<void>>(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.put<ApiResponse<void>>('/api/notifications/mark-all-read');
    return response.data;
  },
};

export default authApi;