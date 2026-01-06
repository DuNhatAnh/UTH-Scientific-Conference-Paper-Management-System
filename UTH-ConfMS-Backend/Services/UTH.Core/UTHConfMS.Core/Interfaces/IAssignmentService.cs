using UTHConfMS.Core.DTOs;

namespace UTHConfMS.Core.Interfaces
{
    public interface IAssignmentService
    {
        Task<bool> AssignReviewerAsync(AssignReviewerDTO dto);
        Task<IEnumerable<object>> GetReviewersForPaperAsync(int paperId); // Lấy DS ai đang chấm bài này
    }
}