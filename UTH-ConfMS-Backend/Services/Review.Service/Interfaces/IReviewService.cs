using Review.Service.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Review.Service.Interfaces
{
    public interface IReviewService
    {
        Task SubmitReviewAsync(SubmitReviewDTO dto, string reviewerId);
        Task AddDiscussionCommentAsync(DiscussionCommentDTO dto, string userId, string userName);
        Task<List<DiscussionCommentDTO>> GetDiscussionAsync(string paperId);
        Task SubmitRebuttalAsync(RebuttalDTO dto, string authorId);
        
        /// <summary>
        /// Lấy tổng hợp điểm và nhận xét từ tất cả reviewer cho một bài báo
        /// </summary>
        Task<ReviewSummaryDTO> GetReviewSummaryAsync(string paperId, bool isAuthorView = false);

        Task<IEnumerable<ReviewAssignmentDTO>> GetAssignmentsForReviewerAsync(string userId, string? status = null, int page = 1, int pageSize = 20);

        /// <summary>
        /// Lấy danh sách bài nộp cần đưa ra quyết định (dành cho Chair)
        /// </summary>
        Task<List<SubmissionForDecisionDTO>> GetSubmissionsForDecisionAsync(string? conferenceId = null);

        /// <summary>
        /// Chair đưa ra quyết định cuối cùng cho bài báo
        /// </summary>
        Task SubmitDecisionAsync(SubmitDecisionDTO dto, string chairId);
        Task<SubmitReviewDTO?> GetMyReviewAsync(string paperId, string userId);
    }
}