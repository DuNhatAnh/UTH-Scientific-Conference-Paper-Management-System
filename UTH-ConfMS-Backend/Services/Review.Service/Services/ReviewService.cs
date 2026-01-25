using Microsoft.EntityFrameworkCore;
using Review.Service.Data;
using Review.Service.DTOs;
using Review.Service.Entities;
using Review.Service.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Review.Service.Services
{
    public class ReviewService : IReviewService
    {
        private readonly ReviewDbContext _context;
        
        // Giữ lại mock list cho Discussion vì chưa có bảng Discussion trong DB
        private static List<DiscussionCommentDTO> _discussions = new List<DiscussionCommentDTO>();

        public ReviewService(ReviewDbContext context)
        {
            _context = context;
        }

        public async Task SubmitReviewAsync(SubmitReviewDTO dto, string reviewerId)
        {
            // 1. Tìm Assignment - Nếu không thấy thì TỰ TẠO (Auto-fix cho demo)
            Assignment? assignment = null;

            if (!string.IsNullOrEmpty(reviewerId) && reviewerId != "0")
            {
                assignment = await _context.Assignments
                    .FirstOrDefaultAsync(a => a.PaperId == dto.PaperId.ToString());
            }

            // [AUTO-CREATE ASSIGNMENT IF MISSING]
            if (assignment == null)
            {
                // 1a. Đảm bảo có Reviewer thực sự trong Database (Ánh xạ từ GUID sang INT ID)
                Reviewer? reviewer = null;
                
                if (!string.IsNullOrEmpty(reviewerId) && reviewerId != "0")
                {
                    // Tìm reviewer theo GUID UserId
                    reviewer = await _context.Reviewers.FirstOrDefaultAsync(r => r.UserId == reviewerId);
                }

                if (reviewer == null)
                {
                    // Nếu không thấy hoặc là anonymous, lấy/tạo Dummy Reviewer
                    reviewer = await _context.Reviewers.FirstOrDefaultAsync(r => r.Email == "reviewer@uth.edu.vn");
                    if (reviewer == null)
                    {
                        reviewer = new Reviewer
                        {
                            Email = "reviewer@uth.edu.vn",
                            FullName = "Reviewer Auto",
                            ConferenceId = 1,
                            MaxPapers = 5,
                            UserId = reviewerId ?? "0",
                            Expertise = "General"
                        };
                        _context.Reviewers.Add(reviewer);
                        await _context.SaveChangesAsync();
                    }
                }

                // 1b. Tạo Assignment sử dụng Integer Id của Reviewer
                assignment = new Assignment
                {
                    PaperId = dto.PaperId.ToString(),
                    ReviewerId = reviewer.Id,
                    Status = "Pending",
                    AssignedDate = DateTime.UtcNow
                };
                _context.Assignments.Add(assignment);
                await _context.SaveChangesAsync();
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
                existingReview.CommentsForAuthor = dto.CommentsForAuthor;
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
                    CommentsForAuthor = dto.CommentsForAuthor,
                    ConfidentialComments = dto.ConfidentialComments,
                    Recommendation = dto.Recommendation,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Reviews.Add(review);
            }

            // 3. Lưu xuống Assignment (Cập nhật trạng thái)
            assignment.Status = "Completed"; // Đánh dấu là đã review xong
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
            // Lấy tất cả reviews của paper này bằng cách join với Assignment
            var paperReviews = await _context.Reviews
                .Include(r => r.Assignment)
                .Where(r => r.Assignment.PaperId == paperId)
                .ToListAsync();
            
            if (!paperReviews.Any())
            {
                return new ReviewSummaryDTO
                {
                    PaperId = paperId,
                    TotalReviews = 0,
                    Reviews = new List<ReviewDetailDTO>()
                };
            }
            
            // Tính điểm trung bình
            var avgNovelty = paperReviews.Average(r => r.NoveltyScore);
            var avgMethodology = paperReviews.Average(r => r.MethodologyScore);
            var avgPresentation = paperReviews.Average(r => r.PresentationScore);
            var overallAvg = (avgNovelty + avgMethodology + avgPresentation) / 3.0;
            
            // Đếm số lượng recommendation
            var acceptCount = paperReviews.Count(r => 
                r.Recommendation?.ToLower() == "accept");
            var rejectCount = paperReviews.Count(r => 
                r.Recommendation?.ToLower() == "reject");
            var revisionCount = paperReviews.Count(r => 
                r.Recommendation?.ToLower().Contains("revision") == true);
            
            // Tạo danh sách chi tiết
            var reviewDetails = paperReviews.Select((r, index) => new ReviewDetailDTO
            {
                // Sử dụng UserId (String/GUID) từ Reviewer thay vì PK int
                ReviewerId = r.Assignment.Reviewer?.UserId ?? r.Assignment.ReviewerId.ToString(), 
                ReviewerName = r.Assignment.Reviewer?.FullName ?? $"Reviewer {r.Assignment.ReviewerId}",
                NoveltyScore = r.NoveltyScore,
                MethodologyScore = r.MethodologyScore,
                PresentationScore = r.PresentationScore,
                CommentsForAuthor = r.CommentsForAuthor,
                ConfidentialComments = r.ConfidentialComments,
                Recommendation = r.Recommendation,
                SubmittedAt = r.CreatedAt
            }).ToList();
            
            var summary = new ReviewSummaryDTO
            {
                PaperId = paperId,
                TotalReviews = paperReviews.Count,
                AverageNoveltyScore = Math.Round(avgNovelty, 2),
                AverageMethodologyScore = Math.Round(avgMethodology, 2),
                AveragePresentationScore = Math.Round(avgPresentation, 2),
                OverallAverageScore = Math.Round(overallAvg, 2),
                AcceptCount = acceptCount,
                RejectCount = rejectCount,
                RevisionCount = revisionCount,
                Reviews = reviewDetails
            };
            
            Console.WriteLine($"[ReviewService] Generated DB summary for Paper {paperId}: {summary.TotalReviews} reviews, avg: {summary.OverallAverageScore}");
            
            return summary;
        }

        public async Task<List<SubmissionForDecisionDTO>> GetSubmissionsForDecisionAsync(int? conferenceId = null)
        {
            // Lấy tất cả Assignments
            var query = _context.Assignments.AsQueryable();
            
            var paperGroups = await query
                .GroupBy(a => a.PaperId)
                .Select(g => new
                {
                    PaperId = g.Key,
                    TotalAssignments = g.Count(),
                    CompletedReviews = g.Count(a => a.Status == "Completed")
                })
                .ToListAsync();

            var result = new List<SubmissionForDecisionDTO>();

            foreach (var group in paperGroups)
            {
                // Tính điểm trung bình
                var reviews = await _context.Reviews
                    .Where(r => r.Assignment.PaperId == group.PaperId)
                    .ToListAsync();
                
                double? averageScore = null;
                if (reviews.Any())
                {
                    averageScore = reviews.Average(r => (r.NoveltyScore + r.MethodologyScore + r.PresentationScore) / 3.0);
                    averageScore = Math.Round(averageScore.Value, 2);
                }

                // Tiêu đề giả lập nếu không có DB Submission ở đây
                string title = $"Paper {group.PaperId}";
                if (group.PaperId == "101") title = "Deep Learning Approaches for Traffic Flow Prediction";
                else if (group.PaperId == "102") title = "Deep Learning Approaches for Traffic Flow Prediction in Smart Cities";
                else if (group.PaperId == "103") title = "Deep Learning Approaches for Traffic Flow Prediction";

                result.Add(new SubmissionForDecisionDTO
                {
                    SubmissionId = group.PaperId,
                    Title = title,
                    Authors = new List<string> { "Nguyễn Văn A", "Trần Thị B" },
                    TopicName = "AI & Big Data",
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
            var hasAssignments = await _context.Assignments.AnyAsync(a => a.PaperId == dto.PaperId);
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
                    DecidedBy = 0 // Tạm thời để 0 cho demo, thực tế map từ chairId int
                };
                _context.Decisions.Add(decision);
            }
            else
            {
                decision.Status = dto.Status;
                decision.Comments = dto.Comments;
                decision.DecisionDate = DateTime.UtcNow;
                _context.Decisions.Update(decision);
            }

            await _context.SaveChangesAsync();
            Console.WriteLine($"[ReviewService] Chair {chairId} submitted decision '{dto.Status}' for Paper {dto.PaperId}");
        }
    }
}
