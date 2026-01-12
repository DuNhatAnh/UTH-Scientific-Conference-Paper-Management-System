// import { api } from './api';

// // Interface cho việc tạo Track/Conference
// export interface CreateConferenceDto {
//   name: string;
//   description: string;
//   startDate: string;
//   endDate: string;
// }

// export interface AssignReviewerDto {
//   paperId: number;
//   reviewerId: number;
// }

// export const adminApi = {
//   // --- Quản lý Hội nghị & Track ---
//   createConference: async (data: CreateConferenceDto) => {
//     return api.post('/conferences', data);
//   },

//   createTrack: async (conferenceId: number, name: string) => {
//     return api.post(`/tracks`, { conferenceId, name });
//   },

//   // --- Quản lý Bài báo (Góc nhìn Admin) ---
//   getAllPapers: async (conferenceId?: number) => {
//     const url = conferenceId ? `/papers?conferenceId=${conferenceId}` : '/papers/all';
//     return api.get<any[]>(url);
//   },

//   // --- Phân công Reviewer ---
//   // 1. Lấy danh sách Reviewer khả dụng cho một bài báo (tránh conflict)
//   getAvailableReviewers: async (paperId: number) => {
//     return api.get<any[]>(`/assignments/available-reviewers/${paperId}`);
//   },

//   // 2. Gán bài báo cho Reviewer (Manual Assignment)
//   assignReviewer: async (data: AssignReviewerDto) => {
//     return api.post('/assignments', data);
//   },
  
//   // 3. Chạy thuật toán tự động phân công (Gọi xuống thuật toán matching)
//   autoAssign: async (conferenceId: number) => {
//     return api.post(`/assignments/auto-assign/${conferenceId}`, {});
//   },

//   // --- Quyết định cuối cùng (Accept/Reject) ---
//   makeDecision: async (paperId: number, status: 'Accepted' | 'Rejected') => {
//     return api.post(`/papers/${paperId}/decision`, { status });
//   }
// };