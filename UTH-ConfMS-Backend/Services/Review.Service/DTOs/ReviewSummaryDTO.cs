namespace Review.Service.DTOs
{
    /// <summary>
    /// DTO cho kết quả tổng hợp điểm và nhận xét từ tất cả reviewer
    /// </summary>
    public class ReviewSummaryDTO
    {
        public string PaperId { get; set; }
        public int TotalReviews { get; set; }
        
        // Điểm trung bình từng tiêu chí
        public double AverageNoveltyScore { get; set; }
        public double AverageMethodologyScore { get; set; }
        public double AveragePresentationScore { get; set; }
        public double OverallAverageScore { get; set; }
        
        // Thống kê recommendation
        public int AcceptCount { get; set; }
        public int RejectCount { get; set; }
        public int RevisionCount { get; set; }
        
        // Danh sách review chi tiết
        public List<ReviewDetailDTO> Reviews { get; set; } = new();

        // Danh sách file đính kèm
        public List<ReviewSubmissionFileDTO> Files { get; set; } = new();
    }

    public class ReviewSubmissionFileDTO
    {
        public Guid FileId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string? FileType { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    /// <summary>
    /// DTO cho chi tiết của một review
    /// </summary>
    public class ReviewDetailDTO
    {
        public string ReviewerId { get; set; }
        public string? ReviewerName { get; set; }
        
        // Điểm số (1-5)
        public int NoveltyScore { get; set; }
        public int MethodologyScore { get; set; }
        public int PresentationScore { get; set; }
        
        // Nhận xét
        public string? CommentsForAuthor { get; set; }
        public string? ConfidentialComments { get; set; } // Chỉ Chair/Admin thấy
        
        // Đề xuất
        public string? Recommendation { get; set; }
        public DateTime SubmittedAt { get; set; }
    }
}
