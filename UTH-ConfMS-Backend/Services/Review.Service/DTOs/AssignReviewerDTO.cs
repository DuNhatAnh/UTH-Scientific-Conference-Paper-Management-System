namespace Review.Service.DTOs
{
    public class AssignReviewerDTO
    {
        public string PaperId { get; set; } = string.Empty;
        public int ReviewerId { get; set; } // Local Reviewer ID (Optional if UserId provided)
        public string? ReviewerUserId { get; set; } // Identity User ID (Preferred for new assignments)
        public string? ReviewerEmail { get; set; } // Fallback
    }
}