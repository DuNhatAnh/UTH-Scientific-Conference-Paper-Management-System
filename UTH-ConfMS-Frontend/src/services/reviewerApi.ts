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
  token?: string;
  conferenceId: string;
  conferenceName?: string; // Added from Backend
  status: 'Pending' | 'Accepted' | 'Declined';
  sentAt: string;
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
  assignmentId?: number;
}

export const reviewerApi = {
  // 1. Chair: Gửi lời mời tham gia PC
  inviteReviewer: async (data: InviteReviewerDTO) => {
    return apiClient.post('/api/reviewers/invite', data);
  },

  // 2. User: Phản hồi lời mời (Accept/Decline)
  respondInvitation: async (data: InvitationResponseDTO) => {
    return apiClient.post('/api/reviewers/invitation/respond', data);
  },

  // 2b. User: Xóa lời mời
  deleteInvitation: async (id: number) => {
    return apiClient.delete(`/api/reviewers/invitation/${id}`);
  },

  // 3. Chair: Lấy danh sách các lời mời đã gửi (để theo dõi trạng thái)
  getInvitations: async (conferenceId: string) => {
    return apiClient.get<ReviewerInvitationDto[]>(`/api/reviewers/invitations/${conferenceId}`);
  },

  // 3b. Reviewer: Lấy lời mời của user hiện tại
  getMyInvitations: async () => {
    return apiClient.get<ReviewerInvitationDto[]>(`/api/reviewers/my-invitations`);
  },

  // 4. Chair: Lấy danh sách Reviewer chính thức của hội nghị
  getReviewers: async (conferenceId: string) => {
    return apiClient.get(`/api/reviewers/conference/${conferenceId}`);
  },

  // 5. Reviewer: Lấy danh sách bài báo có thể review (Chỉ khi đã Accepted)
  getReviewableSubmissions: async (conferenceId: string) => {
    return apiClient.get<ReviewableSubmissionDto[]>(`/api/reviewers/${conferenceId}/submissions`);
  }
};