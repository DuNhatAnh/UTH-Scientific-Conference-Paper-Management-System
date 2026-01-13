using Review.Service.DTOs;
using Review.Service.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace Review.Service.Services
{
    public class ReviewService : IReviewService
    {
        // Giả lập Database trong bộ nhớ (In-memory) để test
        private static List<SubmitReviewDTO> _reviews = new List<SubmitReviewDTO>();
        private static List<DiscussionCommentDTO> _discussions = new List<DiscussionCommentDTO>();

        public async Task SubmitReviewAsync(SubmitReviewDTO dto, int reviewerId)
        {
            // Giả lập delay DB
            await Task.Delay(100);
            
            // Logic thực tế: Lưu vào bảng Reviews trong DB
            _reviews.Add(dto);
            
            // Console log để bạn thấy khi test
            Console.WriteLine($"[ReviewService] Reviewer {reviewerId} submitted review for Paper {dto.PaperId}. Score: {dto.NoveltyScore}");
        }

        public async Task AddDiscussionCommentAsync(DiscussionCommentDTO dto, int userId, string userName)
        {
            await Task.Delay(100);
            
            dto.UserName = userName;
            dto.CreatedAt = DateTime.Now;
            _discussions.Add(dto);
            
            Console.WriteLine($"[ReviewService] User {userName} commented on Paper {dto.PaperId}: {dto.Content}");
        }

        public async Task<List<DiscussionCommentDTO>> GetDiscussionAsync(int paperId)
        {
            await Task.Delay(100);
            return _discussions.Where(d => d.PaperId == paperId).OrderBy(d => d.CreatedAt).ToList();
        }

        public async Task SubmitRebuttalAsync(RebuttalDTO dto, int authorId)
        {
            await Task.Delay(100);
            Console.WriteLine($"[ReviewService] Author {authorId} submitted rebuttal for Paper {dto.PaperId}");
        }
    }
}
