using System.ComponentModel.DataAnnotations;

namespace Review.Service.DTOs
{
    // DTO cho việc nộp bài đánh giá (Review)
    public class SubmitReviewDTO
    {
        private string? _paperId;
        
        public object PaperId 
        { 
            get => _paperId ?? string.Empty; 
            set => _paperId = value?.ToString(); 
        }
        
        // Điểm số (Scale 1-5)
        public int NoveltyScore { get; set; }

        public int MethodologyScore { get; set; }

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
        public string PaperId { get; set; }
        public string? Content { get; set; }
        public string? UserName { get; set; } // Tên người comment (trả về khi GET)
        public System.DateTime CreatedAt { get; set; }
    }

    // DTO cho phản hồi của tác giả (Rebuttal) - Optional
    public class RebuttalDTO
    {
        public string PaperId { get; set; }
        public string? Content { get; set; }
    }
}