using Microsoft.EntityFrameworkCore;
using UTHConfMS.Core.Interfaces;
using UTHConfMS.Infra.Data;

namespace UTHConfMS.Infra.Services
{
    public class PaperService : IPaperService
    {
        private readonly AppDbContext _context;

        public PaperService(AppDbContext context)
        {
            _context = context;
        }

        public async Task SubmitPaperAsync(int paperId, int userId, string filePath)
        {
            var paper = await _context.Papers
                .Include(p => p.Authors)
                .FirstOrDefaultAsync(p => p.Id == paperId);

            if (paper == null)
                throw new Exception("Paper not found");

            // Kiểm tra user có phải author của paper không
            bool isAuthor = paper.Authors.Any(a => a.UserId == userId);
            if (!isAuthor)
                throw new Exception("You are not author of this paper");

            // Lưu file
            paper.FilePath = filePath;
            paper.Status = "Submitted";

            await _context.SaveChangesAsync();
        }
    }
}
