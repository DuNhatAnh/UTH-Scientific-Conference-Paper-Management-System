import apiClient, { ApiResponse, MOCK_MODE } from './apiClient';

// DTOs
export interface SubmissionDto {
  id: number;
  title: string;
  abstract?: string;
  keywords?: string[];
  status: string;
  conferenceId: number;
  conferenceName?: string;
  topicId?: number;
  topicName?: string;
  submittedAt: string;
  updatedAt: string;
  correspondingAuthorId?: number;
  correspondingAuthorName?: string;
}

export interface SubmissionDetailDto extends SubmissionDto {
  authors: AuthorDto[];
  files: SubmissionFileDto[];
  reviewSummary?: SubmissionReviewSummaryDto;
  decision?: DecisionDto;
}

export interface AuthorDto {
  authorId: number;
  userId?: number;
  fullName: string;
  email: string;
  affiliation?: string;
  isCorresponding: boolean;
  order: number;
}

export interface SubmissionFileDto {
  fileId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  version: number;
}

export interface SubmissionReviewSummaryDto {
  totalReviews: number;
  completedReviews: number;
  averageScore?: number;
}

export interface DecisionDto {
  decision: string;
  decidedAt: string;
  comments?: string;
}

export interface CreateSubmissionRequest {
  title: string;
  abstract: string;
  keywords: string[];
  conferenceId: number;
  topicId?: number;
  authors: CreateAuthorRequest[];
  file?: File;
}

export interface CreateAuthorRequest {
  fullName: string;
  email: string;
  affiliation?: string;
  isCorresponding: boolean;
  order: number;
}

export interface UpdateSubmissionRequest {
  title?: string;
  abstract?: string;
  keywords?: string[];
  topicId?: number;
}

// Mock submissions data
const MOCK_SUBMISSIONS: SubmissionDto[] = [
  {
    id: 1,
    title: 'Optimizing Neural Networks for Edge Devices',
    abstract: 'This paper proposes novel optimization techniques...',
    keywords: ['AI', 'Edge Computing', 'Optimization'],
    status: 'under_review',
    conferenceId: 1,
    conferenceName: 'ICIST 2026',
    topicId: 1,
    topicName: 'Artificial Intelligence',
    submittedAt: '2026-01-05T10:00:00Z',
    updatedAt: '2026-01-08T14:30:00Z',
  },
  {
    id: 2,
    title: 'A Survey on Smart Grid Security Protocols',
    abstract: 'Comprehensive survey on security protocols...',
    keywords: ['Smart Grid', 'Security', 'IoT'],
    status: 'accepted',
    conferenceId: 1,
    conferenceName: 'ICIST 2026',
    topicId: 2,
    topicName: 'Energy Systems',
    submittedAt: '2026-01-02T08:00:00Z',
    updatedAt: '2026-01-09T16:00:00Z',
  },
  {
    id: 3,
    title: 'Machine Learning Applications in Healthcare',
    abstract: 'Exploring ML applications in modern healthcare...',
    keywords: ['Machine Learning', 'Healthcare', 'Data Science'],
    status: 'revision_required',
    conferenceId: 1,
    conferenceName: 'ICIST 2026',
    topicId: 1,
    topicName: 'Artificial Intelligence',
    submittedAt: '2025-12-28T12:00:00Z',
    updatedAt: '2026-01-07T09:00:00Z',
  },
];

// Submission API
export const submissionApi = {
  getSubmissions: async (
    conferenceId?: number,
    status?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<SubmissionDto[]>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, data: MOCK_SUBMISSIONS };
    }
    const params = new URLSearchParams();
    if (conferenceId) params.append('conferenceId', conferenceId.toString());
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await apiClient.get<ApiResponse<SubmissionDto[]>>(`/api/submissions?${params}`);
    return response.data;
  },

  getMySubmissions: async (
    conferenceId?: number,
    status?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<SubmissionDto[]>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, data: MOCK_SUBMISSIONS };
    }
    const params = new URLSearchParams();
    if (conferenceId) params.append('conferenceId', conferenceId.toString());
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await apiClient.get<ApiResponse<SubmissionDto[]>>(`/api/submissions/my-submissions?${params}`);
    return response.data;
  },

  getSubmission: async (submissionId: number): Promise<ApiResponse<SubmissionDetailDto>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const submission = MOCK_SUBMISSIONS.find(s => s.id === submissionId);
      if (submission) {
        const detail: SubmissionDetailDto = {
          ...submission,
          authors: [
            { authorId: 1, fullName: 'Nguyễn Văn A', email: 'author@uth.edu.vn', affiliation: 'UTH', isCorresponding: true, order: 1 },
            { authorId: 2, fullName: 'Trần Thị B', email: 'tranb@uth.edu.vn', affiliation: 'UTH', isCorresponding: false, order: 2 },
          ],
          files: [
            { fileId: 1, fileName: 'paper.pdf', fileType: 'application/pdf', fileSize: 1024000, uploadedAt: '2026-01-05T10:00:00Z', version: 1 }
          ],
        };
        return { success: true, data: detail };
      }
      return { success: false, message: 'Submission not found' };
    }
    const response = await apiClient.get<ApiResponse<SubmissionDetailDto>>(`/api/submissions/${submissionId}`);
    return response.data;
  },

  createSubmission: async (data: CreateSubmissionRequest): Promise<ApiResponse<SubmissionDto>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newSubmission: SubmissionDto = {
        id: MOCK_SUBMISSIONS.length + 1,
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords,
        status: 'submitted',
        conferenceId: data.conferenceId,
        conferenceName: 'ICIST 2026',
        topicId: data.topicId,
        topicName: 'Artificial Intelligence',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_SUBMISSIONS.push(newSubmission);
      return { success: true, data: newSubmission, message: 'Submission created successfully' };
    }

    // SỬA: Backend nhận JSON body cho createSubmission, không phải FormData
    // File sẽ được upload riêng sau khi tạo submission thành công
    const payload = {
      title: data.title,
      abstract: data.abstract,
      conferenceId: data.conferenceId, // Backend cần Guid, nhưng ở đây ta truyền number/string, axios sẽ tự handle JSON
      primaryTopicId: data.topicId, // Backend dùng PrimaryTopicId thay vì TopicId
      keywords: data.keywords,
      authors: data.authors.map((a, index) => ({
        fullName: a.fullName,
        email: a.email,
        affiliation: a.affiliation,
        isCorresponding: a.isCorresponding,
        orderIndex: index + 1 // Backend dùng OrderIndex
      })),
      paperType: "FULL_PAPER" // Mặc định
    };

    // 1. Tạo Submission (Metadata)
    const response = await apiClient.post<ApiResponse<SubmissionDto>>('/api/submissions', payload);

    if (response.data.success && response.data.data && data.file) {
      // 2. Nếu tạo thành công và có file, gọi API upload file
      const submissionId = response.data.data.id;
      await submissionApi.uploadFile(submissionId, data.file);
    }

    return response.data;
  },

  updateSubmission: async (submissionId: number, data: UpdateSubmissionRequest): Promise<ApiResponse<SubmissionDto>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const idx = MOCK_SUBMISSIONS.findIndex(s => s.id === submissionId);
      if (idx !== -1) {
        MOCK_SUBMISSIONS[idx] = { ...MOCK_SUBMISSIONS[idx], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: MOCK_SUBMISSIONS[idx], message: 'Submission updated successfully' };
      }
      return { success: false, message: 'Submission not found' };
    }
    const response = await apiClient.put<ApiResponse<SubmissionDto>>(`/api/submissions/${submissionId}`, data);
    return response.data;
  },

  withdrawSubmission: async (submissionId: number): Promise<ApiResponse<void>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const idx = MOCK_SUBMISSIONS.findIndex(s => s.id === submissionId);
      if (idx !== -1) {
        MOCK_SUBMISSIONS[idx].status = 'withdrawn';
        return { success: true, message: 'Submission withdrawn successfully' };
      }
      return { success: false, message: 'Submission not found' };
    }
    const response = await apiClient.post<ApiResponse<void>>(`/api/submissions/${submissionId}/withdraw`, { reason: "Author request" });
    return response.data;
  },

  uploadFile: async (submissionId: number, file: File): Promise<ApiResponse<SubmissionFileDto>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockFile: SubmissionFileDto = {
        fileId: Date.now(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        version: 1,
      };
      return { success: true, data: mockFile, message: 'File uploaded successfully' };
    }
    const formData = new FormData();
    formData.append('file', file);

    // API upload file có thể khác, kiểm tra lại route backend nếu cần
    // Giả sử route là /api/submissions/{id}/files
    const response = await apiClient.post<ApiResponse<SubmissionFileDto>>(`/api/submissions/${submissionId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Stats for dashboard
  getMyStats: async (): Promise<ApiResponse<SubmissionStats>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const stats: SubmissionStats = {
        total: MOCK_SUBMISSIONS.length,
        pending: MOCK_SUBMISSIONS.filter(s => s.status === 'submitted').length,
        underReview: MOCK_SUBMISSIONS.filter(s => s.status === 'under_review').length,
        accepted: MOCK_SUBMISSIONS.filter(s => s.status === 'accepted').length,
        rejected: MOCK_SUBMISSIONS.filter(s => s.status === 'rejected').length,
        revisionRequired: MOCK_SUBMISSIONS.filter(s => s.status === 'revision_required').length,
      };
      return { success: true, data: stats };
    }
    const response = await apiClient.get<ApiResponse<SubmissionStats>>('/api/submissions/my-stats');
    return response.data;
  },
};

export interface SubmissionStats {
  total: number;
  pending: number;
  underReview: number;
  accepted: number;
  rejected: number;
  revisionRequired: number;
}

export default submissionApi;
