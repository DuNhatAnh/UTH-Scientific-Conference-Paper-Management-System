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
        private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor _httpContextAccessor;

        public AssignmentService(ReviewDbContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<AssignmentService> logger, Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> AssignReviewerAsync(AssignReviewerDTO dto)
        {
            // 1. Lấy thông tin Reviewer
            Reviewer? reviewer = null;

            if (dto.ReviewerId > 0)
            {
                reviewer = await _context.Reviewers.FindAsync(dto.ReviewerId);
            }
            // Logic mới: Assign bằng UserID (từ Conference Service)
            else if (!string.IsNullOrEmpty(dto.ReviewerUserId))
            {
                 // Resolve ConferenceId from Paper first
                string? conferenceId = null;
                try 
                {
                    var paperClient = _httpClientFactory.CreateClient();
                    var submissionUrl = _configuration["Services:SubmissionServiceUrl"] ?? _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";
                    var paperToken = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
                    if (!string.IsNullOrEmpty(paperToken)) paperClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", paperToken);
                    
                    var paperResp = await paperClient.GetAsync($"{submissionUrl}/api/submissions/{dto.PaperId}");
                    if (paperResp.IsSuccessStatusCode)
                    {
                        var pContent = await paperResp.Content.ReadAsStringAsync();
                        using var pDoc = JsonDocument.Parse(pContent);
                        var root = pDoc.RootElement;
                        JsonElement data = root;
                        if (root.TryGetProperty("data", out var dProp)) data = dProp;
                        if (data.TryGetProperty("conferenceId", out var cIdProp)) conferenceId = cIdProp.GetString();
                    }
                }
                catch (Exception ex) { _logger.LogError(ex, "Error fetching conference ID for reviewer lookup"); }
                 
                // Tìm trong local DB
                reviewer = await _context.Reviewers.FirstOrDefaultAsync(r => r.UserId == dto.ReviewerUserId && r.ConferenceId == conferenceId);

                if (reviewer == null)
                {
                    // STRICT CHECK: Verify User is a Committee Member (Reviewer) in Conference Service
                    // User Request: "người có tài khoản thì vẫn phải được chair của hội nghị đó mới thì mới có quyền reviewer"
                    bool isCommitteeMember = false;
                    try
                    {
                        var confClient = _httpClientFactory.CreateClient();
                        var confUrl = _configuration["Services:ConferenceServiceUrl"] ?? _configuration["ServiceUrls:Conference"] ?? "http://localhost:5002";
                        var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
                        if (!string.IsNullOrEmpty(token)) confClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);

                        var memberResp = await confClient.GetAsync($"{confUrl}/api/conferences/{conferenceId}/members");
                        if (memberResp.IsSuccessStatusCode)
                        {
                            var mContent = await memberResp.Content.ReadAsStringAsync();
                            using var mDoc = JsonDocument.Parse(mContent);
                            if (mDoc.RootElement.TryGetProperty("data", out var mData) && mData.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var m in mData.EnumerateArray())
                                {
                                    // Check userId match (Accessing userId property case-insensitively)
                                    string mUserId = "";
                                    if (m.TryGetProperty("userId", out var uidProp) && uidProp.ValueKind == JsonValueKind.String) mUserId = uidProp.GetString() ?? "";
                                    
                                    // Case-insensitive comparison just in case GUID format differs
                                    if (string.Equals(mUserId, dto.ReviewerUserId, StringComparison.OrdinalIgnoreCase))
                                    {
                                        isCommitteeMember = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception ex) { _logger.LogError(ex, "Error verifying committee membership"); }

                    if (!isCommitteeMember)
                    {
                        throw new Exception("User is not a member of the Program Committee for this conference. Please add them to the committee first.");
                    }

                    // Lấy thông tin User từ Identity Service để tạo record (Sync Details)
                    string userEmail = "";

                    string fullName = "Reviewer";
                    try 
                    {
                        var identityClient = _httpClientFactory.CreateClient();
                        var identityUrl = _configuration["Services:IdentityServiceUrl"] ?? _configuration["ServiceUrls:Identity"] ?? "http://localhost:5001";
                        var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
                        if (!string.IsNullOrEmpty(token)) identityClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);

                        var userResp = await identityClient.GetAsync($"{identityUrl}/api/users/{dto.ReviewerUserId}");
                        if (userResp.IsSuccessStatusCode)
                        {
                            var uContent = await userResp.Content.ReadAsStringAsync();
                            using var uDoc = JsonDocument.Parse(uContent);
                            if (uDoc.RootElement.TryGetProperty("data", out var uData))
                            {
                                if (uData.TryGetProperty("email", out var e)) userEmail = e.GetString() ?? "";
                                if (uData.TryGetProperty("fullName", out var fn)) fullName = fn.GetString() ?? "Reviewer";
                            }
                        }
                    }
                    catch (Exception ex) { _logger.LogError(ex, "Error fetching user info from Identity"); }

                    if (string.IsNullOrEmpty(userEmail) && !string.IsNullOrEmpty(dto.ReviewerEmail)) userEmail = dto.ReviewerEmail;

                    // Lazy Create
                    reviewer = new Reviewer
                    {
                        UserId = dto.ReviewerUserId,
                        ConferenceId = conferenceId ?? "00000000-0000-0000-0000-000000000000",
                        Email = userEmail,
                        FullName = fullName,
                        CreatedAt = DateTime.UtcNow,
                        Expertise = "General"
                    };
                    _context.Reviewers.Add(reviewer);
                    await _context.SaveChangesAsync();
                }
            }
            else if (!string.IsNullOrEmpty(dto.ReviewerEmail))
            {
                // Fallback cũ: Assign bằng email (Auto-create)
                // Resolve ConferenceId from Paper first to ensure we match/create the reviewer for the correct conference
                string? conferenceId = null;
                try 
                {
                    var paperClient = _httpClientFactory.CreateClient();
                    var submissionUrl = _configuration["Services:SubmissionServiceUrl"] ?? _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";
                    var paperToken = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
                    if (!string.IsNullOrEmpty(paperToken)) paperClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", paperToken);
                    
                    var paperResp = await paperClient.GetAsync($"{submissionUrl}/api/submissions/{dto.PaperId}");
                    if (paperResp.IsSuccessStatusCode)
                    {
                        var pContent = await paperResp.Content.ReadAsStringAsync();
                        using var pDoc = JsonDocument.Parse(pContent);
                        var root = pDoc.RootElement;
                        
                        JsonElement data = root;
                        if (root.TryGetProperty("data", out var dProp)) data = dProp;
                        
                        if (data.TryGetProperty("conferenceId", out var cIdProp)) conferenceId = cIdProp.GetString();
                    }
                }
                catch (Exception ex) { _logger.LogError(ex, "Error fetching conference ID for reviewer lookup"); }

                // Now find the reviewer record FOR THIS SPECIFIC CONFERENCE
                reviewer = await _context.Reviewers.FirstOrDefaultAsync(r => r.Email == dto.ReviewerEmail && r.ConferenceId == conferenceId);
                
                if (reviewer == null)
                {
                    // Auto-create simplified Reviewer for Testing/UX
                    reviewer = new Reviewer
                    {
                        Email = dto.ReviewerEmail,
                        FullName = dto.ReviewerEmail.Split('@')[0], // Dummy Name
                        ConferenceId = conferenceId ?? "00000000-0000-0000-0000-000000000000",
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

            // Parse reviewer's UserId to Guid
            if (!Guid.TryParse(reviewer.UserId, out var reviewerGuid))
            {
                throw new Exception("Invalid reviewer user ID format.");
            }

            // 3. Kiểm tra xem đã phân công chưa (tránh trùng lặp)
            if (!Guid.TryParse(dto.PaperId, out var submissionGuid))
            {
                throw new Exception("Invalid paper ID format.");
            }

            var currentAssignmentsCount = await _context.Assignments
                .CountAsync(a => a.SubmissionId == submissionGuid);

            if (currentAssignmentsCount >= 3)
            {
                throw new Exception("Bài báo này đã đủ số lượng Reviewer tối đa (3 người).");
            }

            var exists = await _context.Assignments
                .AnyAsync(a => a.SubmissionId == submissionGuid && a.ReviewerId == reviewerGuid);
            
            if (exists) throw new Exception("Reviewer already assigned to this paper.");

            // 4. Tạo phân công
            var assignment = new Assignment
            {
                SubmissionId = submissionGuid,
                ReviewerId = reviewerGuid,  // Use Guid from reviewer.UserId
                AssignedAt = DateTime.UtcNow,
                Status = "PENDING" // Reviewer chưa Accept
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
                var submissionUrl = _configuration["Services:SubmissionServiceUrl"] ?? _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";

                // Add Authorization Header

                // Add Authorization Header
                var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrEmpty(token))
                {
                    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
                }

                // Gọi Submission Service để lấy thông tin bài báo và tác giả
                var response = await client.GetAsync($"{submissionUrl}/api/submissions/{paperId}");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(content);
                    var root = doc.RootElement;
                    
                    var data = root;
                    if (root.TryGetProperty("data", out var dataProp))
                    {
                        data = dataProp;
                    }

                    // Kiểm tra danh sách tác giả
                    if (data.TryGetProperty("authors", out var authors) && authors.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var author in authors.EnumerateArray())
                        {
                            // Lấy email tác giả (cần đảm bảo Submission Service trả về trường này)
                            if (author.TryGetProperty("email", out var emailProp))
                            {
                                var authorEmail = emailProp.GetString();
                                if (string.Equals(authorEmail, reviewerEmail, StringComparison.OrdinalIgnoreCase))
                                {
                                    throw new Exception($"Conflict of Interest Detected: Reviewer ({reviewerEmail}) is an author of this paper.");
                                }
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
            // Parse paperId string to Guid
            if (!Guid.TryParse(paperId, out var submissionGuid))
            {
                return new List<object>();
            }

            // Manual join: Assignment.ReviewerId (Guid) == Reviewer.UserId (string as Guid)
            var query = from a in _context.Assignments
                        join r in _context.Reviewers on a.ReviewerId.ToString().ToLower() equals r.UserId.ToLower()
                        where a.SubmissionId == submissionGuid
                        select new {
                    a.Id,
                    ReviewerId = a.ReviewerId,
                    ReviewerName = r.FullName,
                    a.Status,
                    AssignedDate = a.AssignedAt
                };

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<object>> GetAvailableReviewersAsync(string paperId)
        {
            // 1. Gọi Submission Service để lấy ConferenceId của bài báo
            string conferenceId = string.Empty;
            try 
            {
                var client = _httpClientFactory.CreateClient();
                var submissionUrl = _configuration["Services:SubmissionServiceUrl"] ?? _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";

                // Add Authorization Header

                // Add Authorization Header
                var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrEmpty(token))
                {
                    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
                }

                var response = await client.GetAsync($"{submissionUrl}/api/submissions/{paperId}");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(content);
                    if (doc.RootElement.TryGetProperty("conferenceId", out var confIdProp))
                    {
                        conferenceId = confIdProp.GetString() ?? string.Empty;
                    }
                }
            }
            catch (Exception ex) { _logger.LogError(ex, $"Error fetching conference ID for paper {paperId}"); }

            // 2. Tối ưu hóa: Lấy danh sách Reviewer thuộc Conference VÀ chưa được phân công cho bài báo này
            // Sử dụng Subquery trong LINQ để SQL Server xử lý việc lọc, giảm tải cho RAM
            // Parse paperId to Guid for comparison
            if (!Guid.TryParse(paperId, out var submissionGuid))
            {
                return new List<object>();
            }

            // Match Assignment.ReviewerId (Guid) with Reviewer.UserId (string)
            var availableReviewers = await _context.Reviewers
                .Where(r => r.ConferenceId == conferenceId)
                .Select(r => new { r.Id, r.FullName, r.Email, r.Expertise })
                .ToListAsync();

            return availableReviewers;
        }

        public async Task<bool> RespondToAssignmentAsync(Guid assignmentId, bool isAccepted, Guid userId)
        {
            var assignment = await _context.Assignments
                .FirstOrDefaultAsync(a => a.Id == assignmentId);

            if (assignment == null) throw new Exception("Assignment not found.");

            // Check if the userId matches the assignment's ReviewerId
            if (assignment.ReviewerId != userId)
            {
                throw new Exception("Bạn không có quyền phản hồi phân công này.");
            }

            // Chỉ cho phép thay đổi từ PENDING sang ACCEPTED/REJECTED
            if (assignment.Status == "COMPLETED")
            {
                throw new Exception("Assignment đã hoàn thành, không thể thay đổi trạng thái.");
            }

            assignment.Status = isAccepted ? "ACCEPTED" : "REJECTED";

            _context.Assignments.Update(assignment);
            await _context.SaveChangesAsync();

            // TODO: Gửi notification/event cho Chair nếu cần
            return true;
        }
    }
}