using Review.Service.DTOs;

namespace Review.Service.Interfaces
{
    public interface IAssignmentService
    {
        Task<bool> AssignReviewerAsync(AssignReviewerDTO dto);
        Task<bool> RespondToAssignmentAsync(Guid assignmentId, bool isAccepted, Guid userId);
        Task<IEnumerable<object>> GetReviewersForPaperAsync(string paperId); // Lấy DS ai đang chấm bài này
        Task<IEnumerable<object>> GetAvailableReviewersAsync(string paperId);
    }
}