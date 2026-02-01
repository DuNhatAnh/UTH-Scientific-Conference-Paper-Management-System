import apiClient, { ApiResponse, PagedResponse } from './apiClient';

// DTOs
export interface ReviewAssignmentDto {
  id: string;
  paperId: string;
  submissionTitle: string | null;
  submissionAbstract?: string;
  submissionFileName?: string;
  conferenceId: number;
  conferenceName?: string;
  topicName?: string;
  status: string;
  assignedAt: string;
  dueDate: string;
  isCompleted: boolean;
}

export interface ReviewDto {
  id: number;
  assignmentId: string;
  submissionId: number;
  reviewerId: number;
  reviewerName?: string;
  overallScore?: number;
  recommendation: string;
  commentsForAuthor?: string;
  confidentialComments?: string;
  status: string;
  submittedAt?: string;
  scores: ReviewScoreDto[];
}

export interface ReviewScoreDto {
  id: number;
  criteriaName: string;
  score: number;
  maxScore: number;
  comment?: string;
}

export interface SubmitReviewRequest {
  submissionId: number;
  recommendation: string;
  commentsForAuthor: string;
  confidentialComments?: string;
  scores: CreateReviewScoreRequest[];
}

export interface CreateReviewScoreRequest {
  criteriaName: string;
  score: number;
  maxScore: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  recommendation?: string;
  commentsForAuthor?: string;
  confidentialComments?: string;
  scores?: CreateReviewScoreRequest[];
}

// Chair/Admin decision APIs
export interface SubmissionForDecisionDto {
  submissionId: string | number;
  title: string;
  authors?: string[];
  topicName?: string;
  totalReviews: number;
  completedReviews: number;
  averageScore?: number;
  currentStatus: string;
}

export interface MakeDecisionRequest {
  paperId: string | number;
  status: 'Accepted' | 'Rejected' | 'Revision';
  comments?: string;
}

export interface AssignReviewerRequest {
  submissionId: number;
  reviewerEmail: string;
  reviewerUserId?: string; // Added to support robust assignment
  dueDate?: string;
}

// Review API
export const reviewApi = {
  // Reviewer APIs
  getMyAssignments: async (
    conferenceId?: number,
    status?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<ReviewAssignmentDto[]>> => {
    const params = new URLSearchParams();
    if (conferenceId) params.append('conferenceId', conferenceId.toString());
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await apiClient.get<ApiResponse<ReviewAssignmentDto[]>>(`/api/reviews/assignments?${params}`);
    return response.data;
  },

  acceptAssignment: async (assignmentId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>(`/api/assignments/${assignmentId}/accept`);
    return response.data;
  },

  declineAssignment: async (assignmentId: string, reason?: string): Promise<ApiResponse<void>> => {
    // Note: Backend AssignmentController.RejectAssignment does not currently use 'reason', but we categorize it as 'reject'
    const response = await apiClient.post<ApiResponse<void>>(`/api/assignments/${assignmentId}/reject`, { reason });
    return response.data;
  },

  submitReview: async (data: SubmitReviewRequest): Promise<ApiResponse<ReviewDto>> => {
    const response = await apiClient.post<ApiResponse<ReviewDto>>('/api/reviews', data);
    return response.data;
  },

  updateReview: async (reviewId: number, data: UpdateReviewRequest): Promise<ApiResponse<ReviewDto>> => {
    const response = await apiClient.put<ApiResponse<ReviewDto>>(`/api/reviews/${reviewId}`, data);
    return response.data;
  },

  getReview: async (reviewId: number): Promise<ApiResponse<ReviewDto>> => {
    const response = await apiClient.get<ApiResponse<ReviewDto>>(`/api/reviews/${reviewId}`);
    return response.data;
  },

  // Chair/Admin APIs
  getSubmissionsForDecision: async (
    conferenceId?: string | number,
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PagedResponse<SubmissionForDecisionDto>>> => {
    const params = new URLSearchParams();
    if (conferenceId) params.append('conferenceId', conferenceId.toString());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await apiClient.get<ApiResponse<PagedResponse<SubmissionForDecisionDto>>>(`/api/reviews/submissions-for-decision?${params}`);
    return response.data;
  },

  makeDecision: async (data: MakeDecisionRequest): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/api/reviews/decision', data);
    return response.data;
  },

  assignReviewer: async (data: AssignReviewerRequest): Promise<ApiResponse<ReviewAssignmentDto>> => {
    const response = await apiClient.post<ApiResponse<ReviewAssignmentDto>>('/api/assignments', data);
    return response.data;
  },

  // Stats
  getReviewerStats: async (): Promise<ApiResponse<ReviewerStats>> => {
    const response = await apiClient.get<ApiResponse<ReviewerStats>>('/api/reviews/my-stats');
    return response.data;
  },

  // Summary
  getReviewSummary: async (paperId: string | number): Promise<ApiResponse<ReviewSummaryDto>> => {
    const response = await apiClient.get<ApiResponse<ReviewSummaryDto>>(`/api/reviews/summary/${paperId}`);
    return response.data;
  },
};

export interface ReviewerStats {
  totalAssignments: number;
  pendingReviews: number;
  completedReviews: number;
  overdueReviews: number;
}

export interface ReviewSummaryDto {
  paperId: string | number;
  totalReviews: number;
  averageNoveltyScore: number;
  averageMethodologyScore: number;
  averagePresentationScore: number;
  overallAverageScore: number;
  AcceptCount: number;
  RejectCount: number;
  RevisionCount: number;
  reviews: ReviewDetailDto[];
  files: ReviewSummaryFileDto[];
}

export interface ReviewSummaryFileDto {
  fileId: string;
  fileName: string;
  fileSizeBytes: number;
  fileType?: string;
  uploadedAt: string;
}

export interface ReviewDetailDto {
  reviewerId: number;
  reviewerName?: string;
  noveltyScore: number;
  methodologyScore: number;
  presentationScore: number;
  commentsForAuthor?: string;
  confidentialComments?: string;
  recommendation?: string;
  submittedAt: string;
}

export default reviewApi;
