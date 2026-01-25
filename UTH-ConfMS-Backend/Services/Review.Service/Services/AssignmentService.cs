using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Review.Service.DTOs;
using Review.Service.Entities;
using Review.Service.Interfaces;
using Review.Service.Data;
using System.Text.Json;

namespace Review.Service.Services
{
    public class AssignmentService : IAssignmentService
    {
        private readonly ReviewDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AssignmentService> _logger;

        public AssignmentService(ReviewDbContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<AssignmentService> logger)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> AssignReviewerAsync(AssignReviewerDTO dto)
        {
            // 1. Lấy thông tin Reviewer
            Reviewer? reviewer = null;

            if (dto.ReviewerId > 0)
            {
                reviewer = await _context.Reviewers.FindAsync(dto.ReviewerId);
            }
            else if (!string.IsNullOrEmpty(dto.ReviewerEmail))
            {
                reviewer = await _context.Reviewers.FirstOrDefaultAsync(r => r.Email == dto.ReviewerEmail);
                if (reviewer == null)
                {
                    // Auto-create simplified Reviewer for Testing/UX
                    reviewer = new Reviewer
                    {
                        Email = dto.ReviewerEmail,
                        FullName = dto.ReviewerEmail.Split('@')[0], // Dummy Name
                        ConferenceId = 1, // Default to 1 or fetch from paper
                        UserId = "0", // Unknown ID
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Reviewers.Add(reviewer);
                    await _context.SaveChangesAsync();
                }
            }

            if (reviewer == null) throw new Exception("Reviewer not found (Id or Email required).");

            dto.ReviewerId = reviewer.Id; // Update ID for COI check and assignment

            // 2. USCPMS-42: Kiểm tra Conflict of Interest (COI)
            await CheckConflictOfInterestAsync(dto.PaperId, reviewer.Email);

            // 3. Kiểm tra xem đã phân công chưa (tránh trùng lặp)
            var exists = await _context.Assignments
                .AnyAsync(a => a.PaperId == dto.PaperId && a.ReviewerId == dto.ReviewerId);
            
            if (exists) throw new Exception("Reviewer already assigned to this paper.");

            // 4. Tạo phân công
            var assignment = new Assignment
            {
                PaperId = dto.PaperId,
                ReviewerId = dto.ReviewerId,
                AssignedDate = DateTime.UtcNow,
                Status = "Pending" // Reviewer chưa Accept
            };

            _context.Assignments.Add(assignment);
            
            await _context.SaveChangesAsync();

            // TODO: Gửi event/message sang Notification Service để báo email cho Reviewer: "You have been assigned a new paper"
            return true;
        }

        private async Task CheckConflictOfInterestAsync(string paperId, string reviewerEmail)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var submissionUrl = _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";

                // Gọi Submission Service để lấy thông tin bài báo và tác giả
                var response = await client.GetAsync($"{submissionUrl}/api/submissions/{paperId}");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(content);
                    var root = doc.RootElement;

                    // Kiểm tra danh sách tác giả
                    if (root.TryGetProperty("authors", out var authors) && authors.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var author in authors.EnumerateArray())
                        {
                            // Lấy email tác giả (cần đảm bảo Submission Service trả về trường này)
                            var authorEmail = author.GetProperty("email").GetString();
                            if (string.Equals(authorEmail, reviewerEmail, StringComparison.OrdinalIgnoreCase))
                            {
                                throw new Exception($"Conflict of Interest Detected: Reviewer ({reviewerEmail}) is an author of this paper.");
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking COI for Paper {paperId}");
                // Nếu phát hiện COI thì ném lỗi ra ngoài để chặn phân công
                if (ex.Message.Contains("Conflict of Interest")) throw;
            }
        }

        public async Task<IEnumerable<object>> GetReviewersForPaperAsync(string paperId)
        {
            var query = from a in _context.Assignments
                        join r in _context.Reviewers on a.ReviewerId equals r.Id
                        where a.PaperId == paperId
                        select new {
                    a.Id,
                    ReviewerId = a.ReviewerId,
                    ReviewerName = r.FullName,
                    a.Status,
                    a.AssignedDate
                };

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<object>> GetAvailableReviewersAsync(string paperId)
        {
            // 1. Gọi Submission Service để lấy ConferenceId của bài báo
            int conferenceId = 0;
            try 
            {
                var client = _httpClientFactory.CreateClient();
                var submissionUrl = _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";
                var response = await client.GetAsync($"{submissionUrl}/api/submissions/{paperId}");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(content);
                    if (doc.RootElement.TryGetProperty("conferenceId", out var confIdProp))
                    {
                        conferenceId = confIdProp.GetInt32();
                    }
                }
            }
            catch (Exception ex) { _logger.LogError(ex, $"Error fetching conference ID for paper {paperId}"); }

            // 2. Tối ưu hóa: Lấy danh sách Reviewer thuộc Conference VÀ chưa được phân công cho bài báo này
            // Sử dụng Subquery trong LINQ để SQL Server xử lý việc lọc, giảm tải cho RAM
            var availableReviewers = await _context.Reviewers
                .Where(r => r.ConferenceId == conferenceId && 
                            !_context.Assignments.Any(a => a.PaperId == paperId && a.ReviewerId == r.Id))
                .Select(r => new { r.Id, r.FullName, r.Email, r.Expertise })
                .ToListAsync();

            return availableReviewers;
        }
    }
}