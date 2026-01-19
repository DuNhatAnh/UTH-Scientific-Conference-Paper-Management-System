import apiClient from './apiClient';

// Interface cho việc tạo Track/Conference
export interface CreateConferenceDto {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface AssignReviewerDto {
  paperId: number;
  reviewerId: number;
}

export interface InviteReviewerDto {
  conferenceId: number;
  email: string;
  fullName: string;
}

export const adminApi = {
  // --- Quản lý người dùng ---
  getUsers: async (query: string = '', page: number = 1, pageSize: number = 10) => {
    const response: any = await apiClient.get('/api/users/allusers', {
      params: { query, page, pageSize }
    });
    // Xử lý trường hợp apiClient đã trả về data qua interceptor hoặc chưa
    return response.data || response;
  }, 
  updateUser: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/api/users/${id}`);
    return response.data;
  },
  // Lấy danh sách các Role trong hệ thống (phục vụ dropdown hoặc filter) 
  getRoles: async () => {
    const response = await apiClient.get('/api/roles/allroles');
    return response.data || response;
  },
  

  // --- Quản lý Hội nghị & Track ---
  createConference: async (data: CreateConferenceDto) => {
    const response = await apiClient.post('/api/conferences', data);
    return response.data;
  },

  createTrack: async (conferenceId: number, name: string) => {
    const response = await apiClient.post(`/api/tracks`, { conferenceId, name });
    return response.data;
  },

  // --- Quản lý Bài báo (Góc nhìn Admin) ---
  getAllPapers: async (conferenceId?: number) => {
    const url = conferenceId ? `/api/papers?conferenceId=${conferenceId}` : '/api/papers/all';
    const response = await apiClient.get<any[]>(url);
    return response.data;
  },

  // --- Phân công Reviewer ---
  // 1. Lấy danh sách Reviewer khả dụng cho một bài báo (tránh conflict)
  getAvailableReviewers: async (paperId: number) => {
    const response = await apiClient.get<any[]>(`/api/assignments/available-reviewers/${paperId}`);
    return response.data;
  },

  // 1.1 Lấy danh sách Reviewer đã được phân công và trạng thái (USCPMS-44)
  getReviewersForPaper: async (paperId: number) => {
    const response = await apiClient.get<any[]>(`/api/assignments/paper/${paperId}`);
    return response.data;
  },

  // 2. Gán bài báo cho Reviewer (Manual Assignment)
  assignReviewer: async (data: AssignReviewerDto) => {
    const response = await apiClient.post('/api/assignments', data);
    return response.data;
  },
  
  // 3. Chạy thuật toán tự động phân công (Gọi xuống thuật toán matching)
  autoAssign: async (conferenceId: number) => {
    const response = await apiClient.post(`/api/assignments/auto-assign/${conferenceId}`, {});
    return response.data;
  },

  // --- Mời Reviewer (USCPMS-41) ---
  inviteReviewer: async (data: InviteReviewerDto) => {
    const response = await apiClient.post('/api/reviewers/invite', data);
    return response.data;
  },

  // --- Quyết định cuối cùng (Accept/Reject) ---
  makeDecision: async (paperId: number, status: 'Accepted' | 'Rejected') => {
    const response = await apiClient.post(`/papers/${paperId}/decision`, { status });
    return response.data;
  }
};