namespace Review.Service.DTOs
{
    public class ReviewAssignmentDTO
    {
        public int Id { get; set; }
        public string PaperId { get; set; }
        public string? SubmissionTitle { get; set; }
        public string? SubmissionAbstract { get; set; }
        public string? SubmissionFileName { get; set; }
        public string ConferenceId { get; set; }
        public string Status { get; set; }
        public string AssignedAt { get; set; }
        public string? DueDate { get; set; }
        public bool IsCompleted { get; set; }
    }
}
