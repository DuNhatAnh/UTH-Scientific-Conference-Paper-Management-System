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

export const adminApi = {
  // --- Quản lý Hội nghị & Track ---
  createConference: async (data: CreateConferenceDto) => {
    const response = await apiClient.post('/conferences', data);
    return response.data;
  },

  createTrack: async (conferenceId: number, name: string) => {
    const response = await apiClient.post(`/tracks`, { conferenceId, name });
    return response.data;
  },

  // --- Quản lý Bài báo (Góc nhìn Admin) ---
  getAllPapers: async (conferenceId?: number) => {
    const url = conferenceId ? `/papers?conferenceId=${conferenceId}` : '/papers/all';
    const response = await apiClient.get<any[]>(url);
    return response.data;
  },

  // --- Phân công Reviewer ---
  // 1. Lấy danh sách Reviewer khả dụng cho một bài báo (tránh conflict)
  getAvailableReviewers: async (paperId: number) => {
    const response = await apiClient.get<any[]>(`/assignments/available-reviewers/${paperId}`);
    return response.data;
  },

  // 2. Gán bài báo cho Reviewer (Manual Assignment)
  assignReviewer: async (data: AssignReviewerDto) => {
    const response = await apiClient.post('/assignments', data);
    return response.data;
  },
  
  // 3. Chạy thuật toán tự động phân công (Gọi xuống thuật toán matching)
  autoAssign: async (conferenceId: number) => {
    const response = await apiClient.post(`/assignments/auto-assign/${conferenceId}`, {});
    return response.data;
  },

  // --- Quyết định cuối cùng (Accept/Reject) ---
  makeDecision: async (paperId: number, status: 'Accepted' | 'Rejected') => {
    const response = await apiClient.post(`/papers/${paperId}/decision`, { status });
    return response.data;
  }
};