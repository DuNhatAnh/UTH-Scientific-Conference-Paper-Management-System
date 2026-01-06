using Microsoft.EntityFrameworkCore;
using UTHConfMS.Core.DTOs;
using UTHConfMS.Core.Entities;
using UTHConfMS.Core.Interfaces;
using UTHConfMS.Infra.Data;

namespace UTHConfMS.Infra.Services
{
    public class ReviewService : IReviewService
    {
        private readonly AppDbContext _context;

        public ReviewService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Review> SubmitReviewAsync(SubmitReviewDTO dto)
        {
            // 1. Tìm bản ghi phân công (Assignment) dựa trên PaperId và ReviewerId
            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.PaperId == dto.PaperId && a.ReviewerId == dto.ReviewerId);

            if (assignment == null) throw new Exception("You are not assigned to review this paper (Assignment not found).");

            // 2. Tạo Review mới (Đã sửa lại tên biến cho khớp với Entity Review.cs)
            var review = new Review
            {
                // Thay vì PaperId/ReviewerId, ta lưu AssignmentId
                AssignmentId = assignment.Id, 

                // Map điểm số
                Score = dto.Score,

                // SỬA: Content -> CommentsForAuthor
                CommentsForAuthor = dto.Comments, 

                // THÊM: Map ConfidentialComments (nếu trong DTO có)
                ConfidentialComments = dto.ConfidentialComments,

                // SỬA: ReviewDate -> SubmittedAt
                SubmittedAt = DateTime.UtcNow 
            };

            _context.Reviews.Add(review);
            
            // 3. Cập nhật trạng thái Assignment thành Completed
            assignment.Status = "Completed";

            await _context.SaveChangesAsync();
            return review;
        }

        public async Task<IEnumerable<object>> GetMyAssignedPapersAsync(int reviewerId)
        {
            // Lấy danh sách bài báo mà user này được gán
            return await _context.Assignments
                .Include(a => a.Paper)
                .Where(a => a.ReviewerId == reviewerId)
                .Select(a => new 
                {
                    AssignmentId = a.Id,
                    PaperId = a.Paper.Id,
                    PaperTitle = a.Paper.Title,
                    Status = a.Status, // Pending / Completed
                    Deadline = "2024-12-31" 
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewsByPaperIdAsync(int paperId)
        {
            // SỬA QUERY: Vì Review không có PaperId, phải đi vòng qua Assignment
            return await _context.Reviews
                .Include(r => r.Assignment)
                .Where(r => r.Assignment.PaperId == paperId)
                .ToListAsync();
        }
    }
}