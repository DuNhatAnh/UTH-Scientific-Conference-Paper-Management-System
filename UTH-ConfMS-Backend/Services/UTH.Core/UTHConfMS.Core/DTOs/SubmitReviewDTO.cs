namespace UTHConfMS.Core.DTOs
{
    public class SubmitReviewDTO
    {
        public int PaperId { get; set; }
        public int ReviewerId { get; set; }
        public int Score { get; set; } // Điểm số (1-100 hoặc 1-5)
        public string Comments { get; set; } // Nhận xét công khai
        public string ConfidentialComments { get; set; } // Nhận xét riêng cho BTC
        public string Recommendation { get; set; } // Accept/Reject/Revision
    }
}