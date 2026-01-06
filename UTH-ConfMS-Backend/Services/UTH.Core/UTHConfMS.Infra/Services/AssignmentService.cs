using Microsoft.EntityFrameworkCore;
using UTHConfMS.Core.DTOs;
using UTHConfMS.Core.Entities;
using UTHConfMS.Core.Interfaces;
using UTHConfMS.Infra.Data;

namespace UTHConfMS.Infra.Services
{
    public class AssignmentService : IAssignmentService
    {
        private readonly AppDbContext _context;

        public AssignmentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> AssignReviewerAsync(AssignReviewerDTO dto)
        {
            // 1. Kiểm tra bài báo tồn tại
            var paper = await _context.Papers.FindAsync(dto.PaperId);
            if (paper == null) throw new Exception("Paper not found");

            // 2. Kiểm tra reviewer tồn tại
            var reviewer = await _context.Users.FindAsync(dto.ReviewerId);
            if (reviewer == null) throw new Exception("Reviewer not found");

            // 3. Kiểm tra xem đã phân công chưa (tránh trùng)
            var exists = await _context.Assignments
                .AnyAsync(a => a.PaperId == dto.PaperId && a.ReviewerId == dto.ReviewerId);
            
            if (exists) return false;

            // 4. Tạo phân công
            var assignment = new Assignment
            {
                PaperId = dto.PaperId,
                ReviewerId = dto.ReviewerId,
                AssignedDate = DateTime.UtcNow,
                Status = "Pending" // Reviewer chưa Accept
            };

            _context.Assignments.Add(assignment);
            
            // Cập nhật trạng thái bài báo sang "Đang phản biện" (Under Review)
            paper.Status = "Under Review";
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<object>> GetReviewersForPaperAsync(int paperId)
        {
            return await _context.Assignments
                .Where(a => a.PaperId == paperId)
                .Select(a => new {
                    a.Id,
                    ReviewerName = a.Reviewer.FullName,
                    a.Status,
                    a.AssignedDate
                }).ToListAsync();
        }
    }
}