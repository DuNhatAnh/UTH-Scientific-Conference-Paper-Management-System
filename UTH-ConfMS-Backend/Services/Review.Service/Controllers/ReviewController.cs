using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Review.Service.DTOs;
using Review.Service.Interfaces;
using Review.Service.DTOs.Common;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace Review.Service.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    [Authorize]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        // API Test nhanh để kiểm tra Controller có chạy không
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok("Pong - Review Service is running!");
        }

        // Helper lấy User ID từ Token (Thường là GUID string)
        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
        }
        
        // Helper lấy Tên User từ Token
        private string GetUserName()
        {
             return User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        }

        [HttpPost("submit")]
        [AllowAnonymous] // Tạm thời mở để test
        // [Authorize(Roles = "reviewer,chair")]
        public async Task<IActionResult> SubmitReview([FromBody] SubmitReviewDTO dto)
        {
            try
            {
                var userId = GetUserId();
                // Trong môi trường test anonymous, nếu userId là "0" hoặc null, ta vẫn cho phép qua
                await _reviewService.SubmitReviewAsync(dto, userId);
                return Ok(ApiResponse<object>.SuccessResponse(null, "Đánh giá đã được gửi thành công!"));
            }
            catch (Exception ex)
            {
                var fullMessage = ex.Message + (ex.InnerException != null ? " Inner: " + ex.InnerException.Message : "");
                Console.WriteLine(fullMessage);
                return BadRequest(ApiResponse<object>.ErrorResponse(fullMessage));
            }
        }

        [HttpGet("my-review/{paperId}")]
        public async Task<IActionResult> GetMyReview(string paperId)
        {
            try
            {
                var review = await _reviewService.GetMyReviewAsync(paperId, GetUserId());
                return Ok(ApiResponse<SubmitReviewDTO?>.SuccessResponse(review));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
            }
        }

        // 2. API Thảo luận nội bộ (PC Members / Chairs / Reviewers)
        [HttpPost("discussion")]
        [Authorize(Policy = "RequireReviewCreate")]
        public async Task<IActionResult> AddDiscussion([FromBody] DiscussionCommentDTO dto)
        {
            try
            {
                await _reviewService.AddDiscussionCommentAsync(dto, GetUserId(), GetUserName());
                return Ok(ApiResponse<object>.SuccessResponse(null, "Đã thêm thảo luận."));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
            }
        }

        // 3. API Lấy danh sách thảo luận của một bài báo
        [HttpGet("discussion/{paperId}")]
        [Authorize(Policy = "RequireReviewCreate")]
        public async Task<IActionResult> GetDiscussions(string paperId)
        {
            var comments = await _reviewService.GetDiscussionAsync(paperId);
            return Ok(ApiResponse<List<DiscussionCommentDTO>>.SuccessResponse(comments));
        }
        
// 4. API Tác giả phản hồi (Rebuttal) - Optional
        [HttpPost("rebuttal")]
        [Authorize(Roles = "author")]
        public async Task<IActionResult> SubmitRebuttal([FromBody] RebuttalDTO dto)
        {
            // Logic xử lý rebuttal (lưu vào DB)
            return Ok(new { message = "Chức năng đang phát triển (TP5 Optional)" });
        }

        // 5. API Tổng hợp điểm và nhận xét từ reviewer (Dành cho Chair/Admin)
        /// <summary>
        /// Lấy tổng hợp điểm và nhận xét từ tất cả reviewer cho một bài báo
        /// </summary>
        /// <param name="paperId">ID của bài báo</param>
        /// <returns>Tổng hợp điểm trung bình, thống kê recommendation và danh sách chi tiết</returns>
        [HttpGet("summary/{paperId}")]
        [AllowAnonymous] // Tạm thời mở để test
        public async Task<IActionResult> GetReviewSummary(string paperId)
        {
            try
            {
                var summary = await _reviewService.GetReviewSummaryAsync(paperId);
                return Ok(ApiResponse<ReviewSummaryDTO>.SuccessResponse(summary));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
            }
        }

        [HttpGet("submissions-for-decision")]
        [AllowAnonymous] // Tạm thời mở để test
        public async Task<IActionResult> GetSubmissionsForDecision([FromQuery] string? conferenceId = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var submissions = await _reviewService.GetSubmissionsForDecisionAsync(conferenceId);
                // Simple pagination
                var totalItems = submissions.Count;
                var paginatedItems = submissions.Skip((page - 1) * pageSize).Take(pageSize).ToList();
                
                var response = new
                {
                    items = paginatedItems,
                    totalItems = totalItems,
                    page = page,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling((double)totalItems / pageSize)
                };
                
                return Ok(ApiResponse<object>.SuccessResponse(response));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
            }
        }

        // API: Lấy danh sách phân công (cho reviewer hiện tại) - chỉ show những phân công thực sự (Accepted/Completed)
        [HttpGet("assignments")]
        [AllowAnonymous] // Temporarily allow anonymous for testing
        public async Task<IActionResult> GetMyAssignments([FromQuery] string? userId = null, [FromQuery] string? status = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var actualUserId = userId ?? GetUserId();
                var assignments = await _reviewService.GetAssignmentsForReviewerAsync(actualUserId, status, page, pageSize);
                return Ok(ApiResponse<IEnumerable<ReviewAssignmentDTO>>.SuccessResponse(assignments));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
            }
        }

        [HttpPost("decision")]
        [AllowAnonymous] // Tạm thời để test demo
        public async Task<IActionResult> SubmitDecision([FromBody] SubmitDecisionDTO dto)
        {
            try
            {
                await _reviewService.SubmitDecisionAsync(dto, GetUserId());
                return Ok(ApiResponse<object>.SuccessResponse(null, "Quyết định đã được lưu thành công."));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
            }
        }
    }
}

