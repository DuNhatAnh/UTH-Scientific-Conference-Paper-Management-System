import apiClient, { ApiResponse, MOCK_MODE } from './apiClient';

// DTOs
export interface ReviewAssignmentDto {
  id: number;
  submissionId: number;
  submissionTitle: string;
  submissionAbstract?: string;
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
  assignmentId: number;
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
  dueDate?: string;
}

// Mock review assignments
const MOCK_ASSIGNMENTS: ReviewAssignmentDto[] = [
  {
    id: 1,
    submissionId: 1,
    submissionTitle: 'Deep Learning Approaches for Traffic Flow Prediction',
    submissionAbstract: 'This paper proposes a novel hybrid architecture...',
    conferenceId: 1,
    conferenceName: 'ICIST 2026',
    topicName: 'Artificial Intelligence',
    status: 'pending',
    assignedAt: '2026-01-06T10:00:00Z',
    dueDate: '2026-01-20T23:59:59Z',
    isCompleted: false,
  },
  {
    id: 2,
    submissionId: 2,
    submissionTitle: 'Blockchain-based Supply Chain Management',
    submissionAbstract: 'We present a decentralized approach...',
    conferenceId: 1,
    conferenceName: 'ICIST 2026',
    topicName: 'Blockchain',
    status: 'accepted',
    assignedAt: '2026-01-04T08:00:00Z',
    dueDate: '2026-01-18T23:59:59Z',
    isCompleted: false,
  },
];

const MOCK_SUBMISSIONS_FOR_DECISION: SubmissionForDecisionDto[] = [
  {
    submissionId: 1,
    title: 'Optimizing Neural Networks for Edge Devices',
    authors: ['Nguyễn Văn A', 'Trần Thị B'],
    topicName: 'Artificial Intelligence',
    totalReviews: 2,
    completedReviews: 2,
    averageScore: 4.2,
    currentStatus: 'under_review',
  },
  {
    submissionId: 3,
    title: 'Machine Learning Applications in Healthcare',
    authors: ['Lê Văn C'],
    topicName: 'Artificial Intelligence',
    totalReviews: 2,
    completedReviews: 2,
    averageScore: 2.8,
    currentStatus: 'under_review',
  },
];

// Review API
export const reviewApi = {
  // Reviewer APIs
  getMyAssignments: async (
    conferenceId?: number,
    status?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<ReviewAssignmentDto[]>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, data: MOCK_ASSIGNMENTS };
    }
    const params = new URLSearchParams();
    if (conferenceId) params.append('conferenceId', conferenceId.toString());
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await apiClient.get<ApiResponse<ReviewAssignmentDto[]>>(`/api/reviews/assignments?${params}`);
    return response.data;
  },

  acceptAssignment: async (assignmentId: number): Promise<ApiResponse<void>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const assignment = MOCK_ASSIGNMENTS.find(a => a.id === assignmentId);
      if (assignment) assignment.status = 'accepted';
      return { success: true };
    }
    const response = await apiClient.post<ApiResponse<void>>(`/api/reviews/assignments/${assignmentId}/accept`);
    return response.data;
  },

  declineAssignment: async (assignmentId: number, reason?: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>(`/api/reviews/assignments/${assignmentId}/decline`, { reason });
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
  ): Promise<ApiResponse<SubmissionForDecisionDto[]>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, data: MOCK_SUBMISSIONS_FOR_DECISION };
    }
    const params = new URLSearchParams();
    if (conferenceId) params.append('conferenceId', conferenceId.toString());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await apiClient.get<ApiResponse<SubmissionForDecisionDto[]>>(`/api/reviews/submissions-for-decision?${params}`);
    return response.data;
  },

  makeDecision: async (data: MakeDecisionRequest): Promise<ApiResponse<void>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, message: 'Quyết định đã được lưu' };
    }
    const response = await apiClient.post<ApiResponse<void>>('/api/reviews/decision', data);
    return response.data;
  },

  assignReviewer: async (data: AssignReviewerRequest): Promise<ApiResponse<ReviewAssignmentDto>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        data: {
          id: Date.now(),
          submissionId: data.submissionId,
          submissionTitle: 'Test Submission',
          conferenceId: 1,
          status: 'pending',
          assignedAt: new Date().toISOString(),
          dueDate: data.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          isCompleted: false,
        }
      };
    }
    const response = await apiClient.post<ApiResponse<ReviewAssignmentDto>>('/api/reviews/assign', data);
    return response.data;
  },

  // Stats
  getReviewerStats: async (): Promise<ApiResponse<ReviewerStats>> => {
    const response = await apiClient.get<ApiResponse<ReviewerStats>>('/api/reviews/my-stats');
    return response.data;
  },

  // Summary
  getReviewSummary: async (paperId: string | number): Promise<ApiResponse<ReviewSummaryDto>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Return mock summary
      return {
        success: true,
        data: {
          paperId: paperId as any, // Bypass mock type check
          totalReviews: 3,
          averageNoveltyScore: 4.0,
          averageMethodologyScore: 3.5,
          averagePresentationScore: 4.5,
          overallAverageScore: 4.0,
          acceptCount: 2,
          rejectCount: 0,
          revisionCount: 1,
          reviews: [
            {
              reviewerId: 101,
              reviewerName: "Reviewer 101",
              noveltyScore: 4,
              methodologyScore: 4,
              presentationScore: 5,
              commentsForAuthor: "Good paper, but needs more experiments.",
              confidentialComments: "Strong accept.",
              recommendation: "Accept",
              submittedAt: new Date().toISOString()
            },
            {
              reviewerId: 102,
              reviewerName: "Reviewer 102",
              noveltyScore: 3,
              methodologyScore: 3,
              presentationScore: 4,
              commentsForAuthor: "Methodology is slightly unclear.",
              recommendation: "Revision",
              submittedAt: new Date().toISOString()
            },
            {
              reviewerId: 103,
              reviewerName: "Reviewer 103",
              noveltyScore: 5,
              methodologyScore: 4,
              presentationScore: 5,
              commentsForAuthor: "Excellent work!",
              recommendation: "Accept",
              submittedAt: new Date().toISOString()
            }
          ]
        }
      };
    }
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
  acceptCount: number;
  rejectCount: number;
  revisionCount: number;
  reviews: ReviewDetailDto[];
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
