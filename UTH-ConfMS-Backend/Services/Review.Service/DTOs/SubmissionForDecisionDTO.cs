using System.Collections.Generic;

namespace Review.Service.DTOs
{
    public class SubmissionForDecisionDTO
    {
        public string SubmissionId { get; set; }
        public string Title { get; set; }
        public List<string>? Authors { get; set; }
        public string? TopicName { get; set; }
        public int TotalReviews { get; set; }
        public int CompletedReviews { get; set; }
        public double? AverageScore { get; set; }
        public string CurrentStatus { get; set; }
    }
}
