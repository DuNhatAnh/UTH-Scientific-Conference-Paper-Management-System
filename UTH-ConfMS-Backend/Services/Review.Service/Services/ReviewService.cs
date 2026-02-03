using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Review.Service.Data;
using Review.Service.DTOs;
using Review.Service.Entities;
using Review.Service.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace Review.Service.Services
{
    public class ReviewService : IReviewService
    {
        private readonly ReviewDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor _httpContextAccessor;
        private readonly ISubmissionClient _submissionClient;
        private readonly ILogger<ReviewService> _logger;
        
        // Giữ lại mock list cho Discussion vì chưa có bảng Discussion trong DB
        private static List<DiscussionCommentDTO> _discussions = new List<DiscussionCommentDTO>();

        public ReviewService(ReviewDbContext context, 
                             IHttpClientFactory httpClientFactory, 
                             IConfiguration configuration, 
                             Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor,
                             ISubmissionClient submissionClient,
                             ILogger<ReviewService> logger)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
            _submissionClient = submissionClient;
            _logger = logger;
        }

        public async Task SubmitReviewAsync(SubmitReviewDTO dto, string reviewerId)
        {
            // 1. Tìm Assignment - Nếu không thấy thì TỰ TẠO (Auto-fix cho demo)
            Assignment? assignment = null;

            if (!string.IsNullOrEmpty(reviewerId) && reviewerId != "0")
            {
                // FIX: Tìm Reviewer Entity trước để lấy UserId (Guid)
                var reviewer = await _context.Reviewers.FirstOrDefaultAsync(r => r.UserId == reviewerId);
                if (reviewer != null && Guid.TryParse(dto.PaperId.ToString(), out var submissionGuid) && Guid.TryParse(reviewer.UserId, out var reviewerGuid))
                {
                    // FIX: Phải lọc theo cả SubmissionId VÀ ReviewerId để tránh lấy nhầm bài của người khác
                    assignment = await _context.Assignments
                        .FirstOrDefaultAsync(a => a.SubmissionId == submissionGuid && a.ReviewerId == reviewerGuid);
                }
            }

            if (assignment == null)
            {
                throw new Exception($"Không tìm thấy phân công (Assignment) cho bài báo {dto.PaperId}. (ReviewerId: {reviewerId})");
            }

            // 2. Kiểm tra xem đã có Review cho Assignment này chưa
            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.AssignmentId == assignment.Id);

            if (existingReview != null)
            {
                // Update review nếu đã tồn tại
                existingReview.NoveltyScore = dto.NoveltyScore;
                existingReview.MethodologyScore = dto.MethodologyScore;
                existingReview.PresentationScore = dto.PresentationScore;
                existingReview.OverallScore = (dto.NoveltyScore + dto.MethodologyScore + dto.PresentationScore) / 3.0;
                existingReview.CommentsForAuthor = dto.CommentsForAuthor ?? string.Empty;
                existingReview.ConfidentialComments = dto.ConfidentialComments;
                existingReview.Recommendation = dto.Recommendation;
                existingReview.UpdatedAt = DateTime.UtcNow;

                _context.Reviews.Update(existingReview);
            }
            else
            {
                // Tạo mới PaperReview
                var review = new PaperReview
                {
                    AssignmentId = assignment.Id,
                    NoveltyScore = dto.NoveltyScore,
                    MethodologyScore = dto.MethodologyScore,
                    PresentationScore = dto.PresentationScore,
                    OverallScore = (dto.NoveltyScore + dto.MethodologyScore + dto.PresentationScore) / 3.0,
                    CommentsForAuthor = dto.CommentsForAuthor ?? string.Empty,
                    ConfidentialComments = dto.ConfidentialComments,
                    Recommendation = dto.Recommendation,
                    SubmittedAt = DateTime.UtcNow
                };
                _context.Reviews.Add(review);
            }

            // 3. Lưu xuống Assignment (Cập nhật trạng thái)
            assignment.Status = "COMPLETED"; // Đánh dấu là đã review xong
            _context.Assignments.Update(assignment);

            await _context.SaveChangesAsync();
            
            Console.WriteLine($"[ReviewService] Saved review for Paper {dto.PaperId} by Reviewer {reviewerId} to Database.");
        }

        public async Task AddDiscussionCommentAsync(DiscussionCommentDTO dto, string userId, string userName)
        {
            // Vẫn dùng Mock Data cho Discussions
            await Task.Delay(100);
            
            dto.UserName = userName;
            dto.CreatedAt = DateTime.Now;
            _discussions.Add(dto);
            
            Console.WriteLine($"[ReviewService] User {userName} commented on Paper {dto.PaperId}: {dto.Content}");
        }

        public async Task<List<DiscussionCommentDTO>> GetDiscussionAsync(string paperId)
        {
            await Task.Delay(100);
            return _discussions.Where(d => d.PaperId == paperId).OrderBy(d => d.CreatedAt).ToList();
        }

        public async Task SubmitRebuttalAsync(RebuttalDTO dto, string authorId)
        {
            await Task.Delay(100);
            Console.WriteLine($"[ReviewService] Author {authorId} submitted rebuttal for Paper {dto.PaperId}");
        }

        public async Task<ReviewSummaryDTO> GetReviewSummaryAsync(string paperId)
        {
            // Parse paperId string to Guid
            if (!Guid.TryParse(paperId, out var submissionGuid))
            {
                return new ReviewSummaryDTO
                {
                    PaperId = paperId,
                    TotalReviews = 0,
                    Reviews = new List<ReviewDetailDTO>()
                };
            }

            // Lấy tất cả reviews của paper này bằng cách join với Assignment
            // 1. Fetch file information from Submission Service (ALWAYS)
            var files = new List<ReviewSubmissionFileDTO>();
            try
            {
                var client = _httpClientFactory.CreateClient();
                var submissionUrl = _configuration["Services:SubmissionServiceUrl"] ?? _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";

                // Add Authorization Header for context propagation
                var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrEmpty(token))
                {
                    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
                }

                var response = await client.GetAsync($"{submissionUrl}/api/submissions/{paperId}/files");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(content);
                    var root = doc.RootElement;
                    
                    JsonElement dataElement = root;
                    if (root.TryGetProperty("data", out var dataProp)) dataElement = dataProp;

                    if (dataElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var file in dataElement.EnumerateArray())
                        {
                            files.Add(new ReviewSubmissionFileDTO
                            {
                                FileId = file.GetProperty("fileId").GetGuid(),
                                FileName = file.GetProperty("fileName").GetString() ?? "Unknown",
                                FileType = file.GetProperty("fileType").GetString(),
                                FileSizeBytes = file.GetProperty("fileSizeBytes").GetInt64(),
                                UploadedAt = file.GetProperty("uploadedAt").GetDateTime()
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch files from Submission Service for paper {PaperId}", paperId);
            }

            // 2. Fetch reviews
            var paperReviews = await _context.Reviews
                .Include(r => r.Assignment)
                .Where(r => r.Assignment.SubmissionId == submissionGuid)
                .ToListAsync();

            // Tính toán thống kê ngay cả khi paperReviews trống để tránh lỗi null/không đồng nhất
            var avgNovelty = paperReviews.Any() ? paperReviews.Average(r => r.NoveltyScore) : 0;
            var avgMethodology = paperReviews.Any() ? paperReviews.Average(r => r.MethodologyScore) : 0;
            var avgPresentation = paperReviews.Any() ? paperReviews.Average(r => r.PresentationScore) : 0;
            var overallAvg = paperReviews.Any() ? paperReviews.Average(r => r.OverallScore) : 0;
            var acceptCount = paperReviews.Count(r => r.Recommendation?.ToLower() == "accept");
            var rejectCount = paperReviews.Count(r => r.Recommendation?.ToLower() == "reject");
            var revisionCount = paperReviews.Count(r => r.Recommendation?.ToLower().Contains("revision") == true);

            var reviewDetails = paperReviews.Select((r, index) => new ReviewDetailDTO
            {
                ReviewerId = r.Assignment.Reviewer?.UserId ?? r.Assignment.ReviewerId.ToString(), 
                ReviewerName = r.Assignment.Reviewer?.FullName ?? $"Reviewer {r.Assignment.ReviewerId}",
                NoveltyScore = r.NoveltyScore,
                MethodologyScore = r.MethodologyScore,
                PresentationScore = r.PresentationScore,
                CommentsForAuthor = r.CommentsForAuthor,
                ConfidentialComments = r.ConfidentialComments,
                Recommendation = r.Recommendation,
                SubmittedAt = r.SubmittedAt
            }).ToList();
            
            var summary = new ReviewSummaryDTO
            {
                PaperId = paperId,
                TotalReviews = paperReviews.Count,
                AverageNoveltyScore = Math.Round(avgNovelty, 1),
                AverageMethodologyScore = Math.Round(avgMethodology, 1),
                AveragePresentationScore = Math.Round(avgPresentation, 1),
                OverallAverageScore = Math.Round(overallAvg, 1),
                AcceptCount = acceptCount,
                RejectCount = rejectCount,
                RevisionCount = revisionCount,
                Reviews = reviewDetails,
                Files = files.OrderByDescending(f => f.UploadedAt).ToList()
            };
            
            Console.WriteLine($"[ReviewService] Generated summary for Paper {paperId}: {summary.TotalReviews} reviews, {summary.Files.Count} files");
            
            return summary;
        }

        public async Task<IEnumerable<ReviewAssignmentDTO>> GetAssignmentsForReviewerAsync(string userId, string? status = null, int page = 1, int pageSize = 20)
        {
            if (string.IsNullOrEmpty(userId) || userId == "0") return new List<ReviewAssignmentDTO>();

            // 0. Auto-link Reviewer profile if it exists by Email but UserId is 0/null (created by Chair via email assignment)
            try 
            {
                var userEmail = _httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                if (!string.IsNullOrEmpty(userEmail)) 
                {
                     var ghostReviewers = await _context.Reviewers
                        .Where(r => r.Email.ToLower() == userEmail.ToLower() && (r.UserId == "0" || r.UserId == null || r.UserId == ""))
                        .ToListAsync();
                     
                     if (ghostReviewers.Any())
                     {
                         foreach (var gr in ghostReviewers)
                         {
                             gr.UserId = userId;
                         }
                         await _context.SaveChangesAsync();
                     }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ReviewService] Error auto-linking reviewer: {ex.Message}");
            }

            // Lấy tất cả phân công của reviewer (bao gồm PENDING, ACCEPTED, COMPLETED, REJECTED)
            // Lấy tất cả phân công của reviewer
            // OPTIMIZED: Direct search by Reviewer Guid
            if (!Guid.TryParse(userId, out var reviewerGuid))
            {
                return new List<ReviewAssignmentDTO>();
            }

            var query = _context.Assignments
                        .Where(a => a.ReviewerId == reviewerGuid)
                        .Select(a => new ReviewAssignmentDTO
                        {
                            Id = a.Id,
                            PaperId = a.SubmissionId.ToString(),
                            SubmissionTitle = null, 
                            SubmissionAbstract = null,
                            SubmissionFileName = null,
                            ConferenceId = null, // Will be filled if we join or fetch
                            Status = a.Status,
                            AssignedAt = a.AssignedAt.ToString("o"),
                            DueDate = a.Deadline.ToString("o"),
                            IsCompleted = a.Status == "COMPLETED"
                        });

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(x => x.Status.ToUpper() == status.ToUpper());
            }

            var skipped = (page - 1) * pageSize;
            var list = await query.Skip(skipped).Take(pageSize).ToListAsync();

            // Gọi Submission Service để lấy Title/Abstract cho từng bài báo
            if (list.Any())
            {
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    var submissionUrl = _configuration["Services:SubmissionServiceUrl"] ?? _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";

                    // Add Authorization Header
                    var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
                    if (!string.IsNullOrEmpty(token))
                    {
                        client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
                    }

                    foreach (var item in list)
                    {
                        try 
                        {
                            var response = await client.GetAsync($"{submissionUrl}/api/submissions/{item.PaperId}");
                            if (response.IsSuccessStatusCode)
                            {
                                var content = await response.Content.ReadAsStringAsync();
                                using var doc = JsonDocument.Parse(content);
                                var root = doc.RootElement;
                                
                                // Unwrap ApiResponse if present (check for "data" property)
                                JsonElement data = root;
                                if (root.TryGetProperty("data", out var dataProp) && dataProp.ValueKind == JsonValueKind.Object)
                                {
                                    data = dataProp;
                                }

                                if (data.TryGetProperty("title", out var titleProp)) item.SubmissionTitle = titleProp.GetString();
                                if (data.TryGetProperty("abstract", out var absProp)) item.SubmissionAbstract = absProp.GetString();
                                
                                // Fix: Submission Service returns 'files' array, not 'attachmentUrl'
                                if (data.TryGetProperty("files", out var filesProp) && filesProp.ValueKind == JsonValueKind.Array)
                                {
                                    foreach (var file in filesProp.EnumerateArray())
                                    {
                                        // Take the first file (or filter by IsMainPaper if available)
                                        if (file.TryGetProperty("fileName", out var nameProp))
                                        {
                                            item.SubmissionFileName = nameProp.GetString();
                                            break; 
                                        }
                                    }
                                }
                            }
                        }
                        catch { /* Bỏ qua lỗi từng item để danh sách vẫn hiển thị */ }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ReviewService] Error fetching submission details: {ex.Message}");
                }
            }

            return list;
        }

        public async Task<List<SubmissionForDecisionDTO>> GetSubmissionsForDecisionAsync(string? conferenceId = null)
        {
            // Fix: Join manually because Assignment.Reviewer navigation property is Ignored in DbContext
            // Fix: Join manually because Assignment.Reviewer navigation property is Ignored in DbContext
            // OPTIMIZED: Use Join on ReviewerId (Guid) = Reviewer.UserId (Parse to Guid?)
            // Since Reviewer.UserId is string, we have to fetch Reviewers first or use client-side eval if Provider doesn't support parsing in SQL
            
            // Step 1: Get all Reviewers for this conference (if filtered)
            var reviewerQuery = _context.Reviewers.AsQueryable();
            if (!string.IsNullOrEmpty(conferenceId))
            {
                reviewerQuery = reviewerQuery.Where(r => r.ConferenceId == conferenceId);
            }
            var reviewers = await reviewerQuery.ToListAsync();
            
            // Step 2: Get their Assignments using in-memory join/filter or list of IDs
            // Note: Converting all Reviewer UserIds to Guids safely
            var reviewerGuids = reviewers
                .Select(r => Guid.TryParse(r.UserId, out var g) ? g : (Guid?)null)
                .Where(g => g.HasValue)
                .Select(g => g.Value)
                .ToList();

            var assignments = await _context.Assignments
                .Where(a => reviewerGuids.Contains(a.ReviewerId))
                .ToListAsync();

            var query = from a in assignments
                        join r in reviewers on a.ReviewerId.ToString() equals r.UserId into joined
                        from r in joined.DefaultIfEmpty() // Left joinish
                        // Actually we need to match back to find the Reviewer object for each assignment
                        let matchedReviewer = reviewers.FirstOrDefault(rv => rv.UserId == a.ReviewerId.ToString())
                        where matchedReviewer != null
                        select new { Assignment = a, Reviewer = matchedReviewer };
                        
            // Re-implement existing grouping logic on memory collection
            var memoryQuery = query;
    
            var paperGroups = query
                .GroupBy(x => x.Assignment.SubmissionId)
                .Select(g => new
                {
                    SubmissionId = g.Key,
                    TotalAssignments = g.Count(),
                    CompletedReviews = g.Count(x => x.Assignment.Status == "COMPLETED")
                })
                .ToList();

            var result = new List<SubmissionForDecisionDTO>();

            foreach (var group in paperGroups)
            {
                // Tính điểm trung bình
                var assignmentIdsForSubmission = assignments.Where(a => a.SubmissionId == group.SubmissionId).Select(a => a.Id).ToList();
                var reviews = await _context.Reviews
                    .Where(r => assignmentIdsForSubmission.Contains(r.AssignmentId))
                    .ToListAsync();
                
                double? averageScore = null;
                if (reviews.Any())
                {
                    averageScore = reviews.Average(r => r.OverallScore);
                    averageScore = Math.Round(averageScore.Value, 2);
                }

                // Tiêu đề giả lập nếu không có DB Submission ở đây
                string title = $"Paper {group.SubmissionId}";
                List<string> authors = new List<string>();
                string topicName = "Unknown";
                
                // Gọi Submission Service để lấy Title thật (tương tự như Reviewer Dashboard)
                try 
                {
                    var client = _httpClientFactory.CreateClient();
                    var submissionUrl = _configuration["Services:SubmissionServiceUrl"] ?? _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";

                    // For internal calls, pass the authorization token to the submission service
                    var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
                    if (!string.IsNullOrEmpty(token))
                    {
                        client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
                    }
                    
                    var response = await client.GetAsync($"{submissionUrl}/api/submissions/{group.SubmissionId}");
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(content);
                        var root = doc.RootElement;
                        
                        // Unwrap ApiResponse if present (check for "data" property)
                        JsonElement data = root;
                        if (root.TryGetProperty("data", out var dataProp) && dataProp.ValueKind == JsonValueKind.Object)
                        {
                            data = dataProp;
                        }
                        
                        if (data.TryGetProperty("title", out var titleProp)) title = titleProp.GetString() ?? title;
                        if (data.TryGetProperty("trackName", out var trackProp)) topicName = trackProp.GetString() ?? topicName;
                        
                        if (data.TryGetProperty("authors", out var authorsProp) && authorsProp.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var author in authorsProp.EnumerateArray())
                            {
                                if (author.TryGetProperty("fullName", out var nameProp)) authors.Add(nameProp.GetString());
                            }
                        }
                    }
                }
                catch { /* Ignore error, use defaults */ }

                result.Add(new SubmissionForDecisionDTO
                {
                    SubmissionId = group.SubmissionId.ToString(),
                    Title = title,
                    Authors = authors,
                    TopicName = topicName,
                    TotalReviews = group.TotalAssignments,
                    CompletedReviews = group.CompletedReviews,
                    AverageScore = averageScore,
                    CurrentStatus = group.CompletedReviews >= group.TotalAssignments ? "Completed" : "Under Review"
                });
            }

            return result;
        }

        public async Task SubmitDecisionAsync(SubmitDecisionDTO dto, string chairId)
        {
            // 1. Kiểm tra bài báo có tồn tại trong hệ thống Review không (thông qua Assignments)
            bool hasAssignments = false;
            if (Guid.TryParse(dto.PaperId, out var submissionGuid))
            {
                hasAssignments = await _context.Assignments.AnyAsync(a => a.SubmissionId == submissionGuid);
            }
            
            if (!hasAssignments)
            {
                throw new Exception($"Không tìm thấy dữ liệu phản biện cho bài báo {dto.PaperId}.");
            }

            // 2. Lưu quyết định
            var decision = await _context.Decisions.FirstOrDefaultAsync(d => d.PaperId == dto.PaperId);
            
            if (decision == null)
            {
                decision = new Decision
                {
                    PaperId = dto.PaperId,
                    Status = dto.Status,
                    Comments = dto.Comments,
                    DecisionDate = DateTime.UtcNow,
                    DecidedBy = int.TryParse(chairId, out int id) ? id : 0
                };
                _context.Decisions.Add(decision);
            }
            else
            {
                decision.Status = dto.Status;
                decision.Comments = dto.Comments;
                decision.DecisionDate = DateTime.UtcNow;
                decision.DecidedBy = int.TryParse(chairId, out int id) ? id : decision.DecidedBy;
                _context.Decisions.Update(decision);
            }

            await _context.SaveChangesAsync();
            
            // 3. Cập nhật trạng thái bài báo sang Submission Service
            try
            {
                // Map "Accepted" -> "ACCEPTED", "Rejected" -> "REJECTED", "Revision" -> "REVISION"
                var submissionStatus = dto.Status.ToUpper();
                
                await _submissionClient.UpdateSubmissionStatusAsync(dto.PaperId, submissionStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update submission status in Submission Service for paper {dto.PaperId}");
            }

            Console.WriteLine($"[ReviewService] Chair {chairId} submitted decision '{dto.Status}' for Paper {dto.PaperId}");
        }

        public async Task<SubmitReviewDTO?> GetMyReviewAsync(string paperId, string userId)
        {
            // Parse paperId to Guid
            if (!Guid.TryParse(paperId, out var submissionGuid))
            {
                return null;
            }

            // Parse userId to Guid for comparison with ReviewerId
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return null;
            }

            // Find review by matching Assignment.SubmissionId and Assignment.ReviewerId
            var review = await _context.Reviews
                .Include(r => r.Assignment)
                .FirstOrDefaultAsync(r => r.Assignment.SubmissionId == submissionGuid && r.Assignment.ReviewerId == userGuid);

            if (review == null) return null;

            return new SubmitReviewDTO
            {
                PaperId = review.Assignment.SubmissionId.ToString(),
                NoveltyScore = review.NoveltyScore,
                MethodologyScore = review.MethodologyScore,
                PresentationScore = review.PresentationScore,
                CommentsForAuthor = review.CommentsForAuthor,
                ConfidentialComments = review.ConfidentialComments,
                Recommendation = review.Recommendation
            };
        }
    }
}
