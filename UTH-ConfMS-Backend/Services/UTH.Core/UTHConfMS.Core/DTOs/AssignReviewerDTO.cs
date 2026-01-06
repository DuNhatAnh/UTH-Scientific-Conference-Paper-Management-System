namespace UTHConfMS.Core.DTOs
{
    public class AssignReviewerDTO
    {
        public int PaperId { get; set; }
        public int ReviewerId { get; set; } // ID của User đóng vai trò Reviewer
    }
}