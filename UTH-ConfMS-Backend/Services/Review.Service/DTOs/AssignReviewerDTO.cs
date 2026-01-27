namespace Review.Service.DTOs
{
    public class AssignReviewerDTO
    {
        public string PaperId { get; set; } = string.Empty;
        public int ReviewerId { get; set; } // ID của User đóng vai trò Reviewer
        public string? ReviewerEmail { get; set; } // Cho phép assign bằng email (Auto-create)
    }
}