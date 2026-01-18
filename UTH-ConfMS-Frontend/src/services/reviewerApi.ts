import apiClient from './apiClient';

// DTO cho việc gửi lời mời
export interface InviteReviewerDTO {
  conferenceId: number;
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
  status: 'Pending' | 'Accepted' | 'Declined';
  sentAt: string;
}

export const reviewerApi = {
  // 1. Chair: Gửi lời mời tham gia PC
  inviteReviewer: async (data: InviteReviewerDTO) => {
    return apiClient.post('/reviewers/invite', data);
  },

  // 2. User: Phản hồi lời mời (Accept/Decline)
  respondInvitation: async (data: InvitationResponseDTO) => {
    return apiClient.post('/reviewers/invitation/respond', data);
  },

  // 3. Chair: Lấy danh sách các lời mời đã gửi (để theo dõi trạng thái)
  getInvitations: async (conferenceId: number) => {
    return apiClient.get<ReviewerInvitationDto[]>(`/reviewers/invitations/${conferenceId}`);
  },

  // 4. Chair: Lấy danh sách Reviewer chính thức của hội nghị
  getReviewers: async (conferenceId: number) => {
    return apiClient.get(`/reviewers/conference/${conferenceId}`);
  }
};