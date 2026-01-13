using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Submission.Service.Data;
using Submission.Service.DTOs;
using Submission.Service.Entities;
using Submission.Service.Interfaces;
using Entities = Submission.Service.Entities;

namespace Submission.Service.Services
{
    public class PaperService : IPaperService
    {
        private readonly SubmissionDbContext _context;

        public PaperService(SubmissionDbContext context)
        {
            _context = context;
        }

        // 1. Tạo bài báo
        public async Task<Guid> CreatePaperAsync(CreatePaperDTO dto, Guid userId)
        {
            var submission = new Entities.Submission
            {
                Title = dto.Title,
                Abstract = dto.Abstract,
                ConferenceId = dto.ConferenceId,
                Status = "DRAFT",
                SubmittedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Submissions.Add(submission);
            await _context.SaveChangesAsync();

            // Lưu tất cả tác giả từ DTO
            foreach (var authorDto in dto.Authors)
            {
                var author = new Entities.Author
                {
                    SubmissionId = submission.Id,
                    FullName = authorDto.FullName,
                    Email = authorDto.Email,
                    Affiliation = authorDto.Affiliation,
                    AuthorOrder = authorDto.OrderIndex,
                    IsCorresponding = authorDto.IsCorresponding
                };

                // Nếu chính là user hiện tại thì gán UserId
                if (author.IsCorresponding)
                    author.UserId = userId;

                _context.Authors.Add(author);
            }

            await _context.SaveChangesAsync();

            return submission.Id;
        }

        // 2. Upload PDF
        public async Task SubmitPaperAsync(Guid paperId, Guid userId, string filePath)
        {
            var submission = await _context.Submissions
                .Include(s => s.Authors)
                .FirstOrDefaultAsync(s => s.Id == paperId);

            if (submission == null)
                throw new Exception("Không tìm thấy bài báo");

            if (!submission.Authors.Any(a => a.UserId == userId))
                throw new Exception("Bạn không phải tác giả");

            var fileInfo = new FileInfo(filePath);

            var file = new Entities.SubmissionFile
            {
                SubmissionId = paperId,
                FileName = fileInfo.Name,
                FilePath = filePath,
                FileSizeBytes = fileInfo.Length,
                FileType = "PDF",
                IsMainPaper = true,
                UploadedBy = userId,
                UploadedAt = DateTime.UtcNow
            };

            submission.Status = "SUBMITTED";
            submission.SubmittedAt = DateTime.UtcNow;

            _context.SubmissionFiles.Add(file);
            await _context.SaveChangesAsync();
        }

        // 3. Lấy danh sách bài
        public async Task<IEnumerable<Entities.Submission>> GetMyPapersAsync(Guid userId)
        {
            return await _context.Submissions
                .Include(s => s.Authors)
                .Where(s => s.Authors.Any(a => a.UserId == userId))
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }
    }
}
