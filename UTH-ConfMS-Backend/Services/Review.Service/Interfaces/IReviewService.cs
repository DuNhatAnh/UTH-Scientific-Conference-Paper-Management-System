using Review.Service.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Review.Service.Interfaces
{
    public interface IReviewService
    {
        Task SubmitReviewAsync(SubmitReviewDTO dto, int reviewerId);
        Task AddDiscussionCommentAsync(DiscussionCommentDTO dto, int userId, string userName);
        Task<List<DiscussionCommentDTO>> GetDiscussionAsync(int paperId);
        Task SubmitRebuttalAsync(RebuttalDTO dto, int authorId);
    }
}