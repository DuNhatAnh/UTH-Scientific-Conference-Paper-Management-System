// import { api, apiClient } from './api';

// // Interface khớp với Entity Paper & DTO Backend
// export interface PaperSubmission {
//   title: string;
//   abstract: string;
//   trackId: number;
//   authors: string[]; // Danh sách tên đồng tác giả
//   file: File;        // File PDF tải lên
// }

// export interface PaperResponse {
//   id: number;
//   title: string;
//   abstract: string;
//   status: string; // 'Submitted', 'UnderReview', 'Accepted', 'Rejected'
//   trackName?: string;
//   submissionDate: string;
//   fileName?: string;
// }

// export const paperApi = {
//   // 1. Nộp bài báo mới (Sử dụng FormData để gửi file)
//   submitPaper: async (data: PaperSubmission) => {
//     const formData = new FormData();
//     formData.append('title', data.title);
//     formData.append('abstract', data.abstract);
//     formData.append('trackId', data.trackId.toString());
    
//     // Xử lý mảng authors (tùy backend nhận dạng nào, thường là lặp append)
//     data.authors.forEach((author, index) => {
//       formData.append(`authors[${index}]`, author);
//     });

//     formData.append('file', data.file);

//     // Gọi POST /api/papers (Content-Type sẽ tự động là multipart/form-data)
//     return apiClient.post('/papers', formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//   },

//   // 2. Lấy danh sách bài báo của người đang đăng nhập
//   getMyPapers: async () => {
//     return api.get<PaperResponse[]>('/papers/my-submissions');
//   },

//   // 3. Lấy chi tiết một bài báo theo ID
//   getPaperDetail: async (id: number) => {
//     return api.get<PaperResponse>(`/papers/${id}`);
//   },

//   // 4. Tải file bài báo (Response dạng Blob để trình duyệt tải về)
//   downloadPaper: async (id: number) => {
//     return apiClient.get(`/papers/${id}/download`, {
//       responseType: 'blob', // Quan trọng: báo axios nhận binary data
//     });
//   },
  
//   // 5. Cập nhật bài báo (Re-submit)
//   updatePaper: async (id: number, data: Partial<PaperSubmission>) => {
//      // Logic tương tự submit nhưng dùng PUT và check có file mới hay không
//      const formData = new FormData();
//      if(data.title) formData.append('title', data.title);
//      if(data.abstract) formData.append('abstract', data.abstract);
//      if(data.file) formData.append('file', data.file);
     
//      return apiClient.put(`/papers/${id}`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//      });
//   }
// };