import apiClient, { ApiResponse, PagedResponse } from "./apiClient";

export interface AuthorSubmission {
  fullName: string;
  email: string;
  affiliation: string;
  isCorresponding: boolean;
  order: number;
}

export interface PaperSubmission {
  title: string;
  abstract: string;
  keywords: string[];
  conferenceId: string;
  topicId?: string; // Changed to string (Guid) if TrackId is Guid.
  authors: AuthorSubmission[];
  file: File;
}

export interface FileInfoDto {
  id: string; // Guid
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface PaperResponse {
  id: string; // Guid - Backend trả về Guid không phải number
  paperNumber?: number; // Số thứ tự bài báo
  title: string;
  abstract: string;
  status: string; // 'Submitted', 'UnderReview', 'Accepted', 'Rejected'
  trackName?: string;
  submissionDate: string;
  fileName?: string;
  files?: FileInfoDto[]; // Thêm thông tin files
}

export const paperApi = {
  // 1. Nộp bài báo mới (Sử dụng FormData để gửi file)
  submitPaper: async (data: PaperSubmission) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("abstract", data.abstract);
    formData.append("conferenceId", data.conferenceId.toString());
    if (data.topicId) formData.append("topicId", data.topicId.toString());

    // Xử lý mảng keywords
    data.keywords.forEach((k) => {
      formData.append("keywords", k);
    });

    // Xử lý mảng authors
    data.authors.forEach((author, index) => {
      formData.append(`authors[${index}].fullName`, author.fullName);
      formData.append(`authors[${index}].email`, author.email);
      formData.append(
        `authors[${index}].affiliation`,
        author.affiliation || "",
      );
      formData.append(
        `authors[${index}].isCorresponding`,
        author.isCorresponding.toString(),
      );
      formData.append(`authors[${index}].order`, author.order.toString());
    });

    formData.append("file", data.file);

    const response = await apiClient.post<ApiResponse<PaperResponse>>(
      "/api/submissions",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  // 2. Lấy danh sách bài báo của người đang đăng nhập
  getMyPapers: async () => {
    const response = await apiClient.get<ApiResponse<PagedResponse<any>>>(
      "/api/submissions/my-submissions",
    );
    const items = response.data?.data?.items || [];
    // Transform SubmittedAt -> submissionDate
    return items.map((item: any) => ({
      ...item,
      submissionDate:
        item.submittedAt || item.submissionDate || new Date().toISOString(),
    }));
  },

  // 3. Lấy chi tiết một bài báo theo ID
  getPaperDetail: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/api/submissions/${id}`,
    );
    const data = response.data?.data;
    if (data) {
      // Transform SubmittedAt -> submissionDate
      return {
        ...response.data,
        data: {
          ...data,
          submissionDate:
            data.submittedAt || data.submissionDate || new Date().toISOString(),
        },
      };
    }
    return response.data;
  },

  // 4. Tải file bài báo (Response dạng Blob để trình duyệt tải về)
  downloadFile: async (submissionId: string, fileId: string) => {
    return apiClient.get(
      `/api/submissions/${submissionId}/files/${fileId}/download`,
      {
        responseType: "blob", // Quan trọng: báo axios nhận binary data
      },
    );
  },

  // 5. Cập nhật bài báo (Re-submit)
  updatePaper: async (id: string, data: Partial<PaperSubmission>) => {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.abstract) formData.append("abstract", data.abstract);
    if (data.keywords) {
      data.keywords.forEach((k) => formData.append("keywords", k));
    }
    if (data.file) formData.append("file", data.file);

    const response = await apiClient.put<ApiResponse<PaperResponse>>(
      `/api/submissions/${id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  // 6. Rút bài báo
  withdrawPaper: async (id: string, reason: string) => {
    const response = await apiClient.post<ApiResponse<void>>(
      `/api/submissions/${id}/withdraw`,
      { reason },
    );
    return response.data;
  },

  // 7. Lấy danh sách bài nộp theo hội nghị (cho Chair)
  getConferenceSubmissions: async (
    conferenceId: string,
    status?: string,
    page: number = 1,
    pageSize: number = 10,
  ) => {
    const params = new URLSearchParams();
    params.append("conferenceId", conferenceId);
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<ApiResponse<PagedResponse<any>>>(
      `/api/submissions?${params}`,
    );
    const items = response.data?.data?.items || [];
    // Transform SubmittedAt -> submissionDate
    return {
      ...response.data,
      data: {
        ...response.data?.data,
        items: items.map((item: any) => ({
          ...item,
          submissionDate:
            item.submittedAt || item.submissionDate || new Date().toISOString(),
        })),
      },
    };
  },
};
