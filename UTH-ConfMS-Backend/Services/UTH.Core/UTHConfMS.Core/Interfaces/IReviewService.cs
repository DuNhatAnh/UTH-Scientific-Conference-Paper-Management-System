using UTHConfMS.Core.DTOs;
using UTHConfMS.Core.Entities;

namespace UTHConfMS.Core.Interfaces
{
    public interface IReviewService
    {
        Task<Review> SubmitReviewAsync(SubmitReviewDTO dto);
        Task<IEnumerable<Review>> GetReviewsByPaperIdAsync(int paperId);
        Task<IEnumerable<object>> GetMyAssignedPapersAsync(int reviewerId); // Lấy bài được giao cho tôi
    }
}