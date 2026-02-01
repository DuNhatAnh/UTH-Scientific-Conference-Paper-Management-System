import apiClient from './apiClient';

// DTO cho việc gửi lời mời
export interface InviteReviewerDTO {
  conferenceId: string;
  email: string;
  fullName: string;
}

// DTO cho phản hồi lời mời
export interface InvitationResponseDTO {
  token: string;
  isAccepted: boolean;
}

// DTO hiển thị thông tin lời mời
export interface ReviewerInvitationDto {
  id: number;
  email: string;
  fullName: string;
  token: string;
  conferenceId: string;
  conferenceName?: string; // Added from Backend
  status: 'Pending' | 'Accepted' | 'Declined';
  sentAt: string;
  respondedAt?: string;
}

export interface ReviewableSubmissionDto {
  id: string;
  paperNumber: number;
  title: string;
  abstract: string;
  trackName: string;
  fileName: string;
  submittedAt: string;
  authors: string[];
  reviewStatus: string; // 'None' | 'Draft' | 'Submitted'
  reviewId?: number;
  assignmentId?: string;
  fileId?: string;
  fileSizeBytes?: number;
  conferenceId?: string;
  conferenceName?: string;
}

export const reviewerApi = {
  // 1. Chair: Gửi lời mời tham gia PC
  inviteReviewer: async (data: InviteReviewerDTO) => {
    const response = await apiClient.post('/api/reviewers/invite', data);
    return response.data;
  },

  // 2. User: Phản hồi lời mời (Accept/Decline)
  respondInvitation: async (data: InvitationResponseDTO) => {
    const response = await apiClient.post('/api/reviewers/invitation/respond', data);
    return response.data;
  },

  // 2a. Public: Lấy thông tin lời mời theo token (không cần auth)
  getInvitationByToken: async (token: string): Promise<ReviewerInvitationDto> => {
    const response = await apiClient.get(`/api/reviewers/invitation/by-token/${token}`);
    return response.data;
  },

  // 2b. User: Xóa lời mời
  deleteInvitation: async (id: number) => {
    const response = await apiClient.delete(`/api/reviewers/invitation/${id}`);
    return response.data;
  },

  // 3. Chair: Lấy danh sách các lời mời đã gửi (để theo dõi trạng thái)
  getInvitations: async (conferenceId: string) => {
    const response = await apiClient.get<ReviewerInvitationDto[]>(`/api/reviewers/invitations/${conferenceId}`);
    return response.data;
  },

  // 3b. Reviewer: Lấy lời mời của user hiện tại
  getMyInvitations: async () => {
    const response = await apiClient.get<ReviewerInvitationDto[]>(`/api/reviewers/my-invitations`);
    return response.data;
  },

  // 4. Chair: Lấy danh sách Reviewer chính thức của hội nghị
  getReviewers: async (conferenceId: string) => {
    const response = await apiClient.get(`/api/reviewers/conference/${conferenceId}`);
    return response.data;
  },

  // 5. Reviewer: Lấy danh sách bài báo có thể review (Chỉ khi đã Accepted)
  getReviewableSubmissions: async (conferenceId: string) => {
    const response = await apiClient.get<ReviewableSubmissionDto[]>(`/api/reviewers/${conferenceId}/submissions`);
    return response.data;
  },

  // 6. Reviewer: Lấy tất cả bài báo đã được gán cho reviewer hiện tại
  getAllMySubmissions: async () => {
    const response = await apiClient.get<ReviewableSubmissionDto[]>(`/api/reviewers/my-submissions`);
    return response.data;
  }
};