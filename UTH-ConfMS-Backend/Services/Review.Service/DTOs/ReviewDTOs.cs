using System.ComponentModel.DataAnnotations;

namespace Review.Service.DTOs
{
    // DTO cho việc nộp bài đánh giá (Review)
    public class SubmitReviewDTO
    {
        [Required]
        public int PaperId { get; set; }
        
        // Điểm số (Scale 1-5)
        [Range(1, 5, ErrorMessage = "Novelty Score must be between 1 and 5")]
        public int NoveltyScore { get; set; }

        [Range(1, 5, ErrorMessage = "Methodology Score must be between 1 and 5")]
        public int MethodologyScore { get; set; }

        [Range(1, 5, ErrorMessage = "Presentation Score must be between 1 and 5")]
        public int PresentationScore { get; set; }
        
        // Nhận xét
        public string? CommentsForAuthor { get; set; } // Tác giả thấy được
        public string? ConfidentialComments { get; set; } // Chỉ PC/Chair thấy
        
        // Quyết định đề xuất
        public string? Recommendation { get; set; } // Accept, Reject, Revision
    }

    // DTO cho thảo luận nội bộ (Discussion)
    public class DiscussionCommentDTO
    {
        public int PaperId { get; set; }
        public string? Content { get; set; }
        public string? UserName { get; set; } // Tên người comment (trả về khi GET)
        public System.DateTime CreatedAt { get; set; }
    }

    // DTO cho phản hồi của tác giả (Rebuttal) - Optional
    public class RebuttalDTO
    {
        public int PaperId { get; set; }
        public string? Content { get; set; }
    }
}