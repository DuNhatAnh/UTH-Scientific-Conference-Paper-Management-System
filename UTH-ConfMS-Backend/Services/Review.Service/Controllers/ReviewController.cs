using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Review.Service.DTOs;
using Review.Service.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;
using System;

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

        // Helper lấy User ID từ Token
        private int GetUserId()
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return idClaim != null ? int.Parse(idClaim) : 0;
        }
        
        // Helper lấy Tên User từ Token
        private string GetUserName()
        {
             return User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        }

        // 1. API Nộp đánh giá (Dành cho Reviewer)
        [HttpPost("submit")]
        [Authorize(Roles = "reviewer,chair")]
        public async Task<IActionResult> SubmitReview([FromBody] SubmitReviewDTO dto)
        {
            try
            {
                var reviewerId = GetUserId();
                await _reviewService.SubmitReviewAsync(dto, reviewerId);
                return Ok(new { message = "Đánh giá đã được gửi thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 2. API Thảo luận nội bộ (PC Members / Chairs / Reviewers)
        [HttpPost("discussion")]
        [Authorize(Roles = "chair,admin,reviewer")]
        public async Task<IActionResult> AddDiscussion([FromBody] DiscussionCommentDTO dto)
        {
            try
            {
                await _reviewService.AddDiscussionCommentAsync(dto, GetUserId(), GetUserName());
                return Ok(new { message = "Đã thêm thảo luận." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 3. API Lấy danh sách thảo luận của một bài báo
        [HttpGet("discussion/{paperId}")]
        [Authorize(Roles = "chair,admin,reviewer")]
        public async Task<IActionResult> GetDiscussions(int paperId)
        {
            var comments = await _reviewService.GetDiscussionAsync(paperId);
            return Ok(comments);
        }
        
// 4. API Tác giả phản hồi (Rebuttal) - Optional
        [HttpPost("rebuttal")]
        [Authorize(Roles = "author")]
        public async Task<IActionResult> SubmitRebuttal([FromBody] RebuttalDTO dto)
        {
            // Logic xử lý rebuttal (lưu vào DB)
            return Ok(new { message = "Chức năng đang phát triển (TP5 Optional)" });
        }
    }
}
