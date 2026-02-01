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
    [Route("api/reviewers")]
    public class ReviewerController : ControllerBase
    {
        private readonly IReviewerService _reviewerService;

        public ReviewerController(IReviewerService reviewerService)
        {
            _reviewerService = reviewerService;
        }

        private string GetUserId()
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return idClaim ?? "0";
        }

        // 1. Gửi lời mời tham gia PC (Dành cho Chair)
        [HttpPost("invite")]
        [Authorize(Policy = "RequireReviewManage")]
        public async Task<IActionResult> InviteReviewer([FromBody] InviteReviewerDTO dto)
        {
            try
            {
                var result = await _reviewerService.InviteReviewerAsync(dto);
                return Ok(new { message = "Đã gửi lời mời thành công.", invitationToken = result.Token });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 2. Phản hồi lời mời (Accept/Decline)
        [HttpPost("invitation/respond")]
        [Authorize] // User cần đăng nhập để Accept và map UserId
        public async Task<IActionResult> RespondInvitation([FromBody] InvitationResponseDTO dto)
        {
            try
            {
                var userId = GetUserId();
                if (dto.IsAccepted && userId == "0")
                {
                    return Unauthorized(new { message = "Bạn cần đăng nhập để chấp nhận lời mời." });
                }

                await _reviewerService.RespondToInvitationAsync(dto, userId);
                return Ok(new { message = dto.IsAccepted ? "Đã tham gia hội đồng PC." : "Đã từ chối lời mời." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 2a. Lấy thông tin lời mời theo token (không cần auth - cho phép xem qua link email)
        [HttpGet("invitation/by-token/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetInvitationByToken(string token)
        {
            try
            {
                var invitation = await _reviewerService.GetInvitationByTokenAsync(token);
                if (invitation == null)
                {
                    return NotFound(new { message = "Lời mời không tồn tại hoặc đã hết hạn." });
                }
                return Ok(invitation);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 2b. Xóa lời mời (Để cleanup ds)
        [HttpDelete("invitation/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteInvitation(int id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == "0") return Unauthorized();

                var success = await _reviewerService.DeleteInvitationAsync(id, userId);
                if (!success) return NotFound(new { message = "Invitation not found." });

                return Ok(new { message = "Đã xóa lời mời." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 3. Lấy danh sách Reviewer của Conference
        [HttpGet("conference/{conferenceId}")]
        public async Task<IActionResult> GetReviewers(string conferenceId)
        {
            var reviewers = await _reviewerService.GetReviewersByConferenceAsync(conferenceId);
            return Ok(reviewers);
        }

        // 4. Lấy danh sách các lời mời đã gửi (Để Chair theo dõi trạng thái Pending/Accepted)
        [HttpGet("invitations/{conferenceId}")]
        [Authorize(Policy = "RequireReviewManage")]
        public async Task<IActionResult> GetInvitations(string conferenceId)
        {
            var invitations = await _reviewerService.GetInvitationsByConferenceAsync(conferenceId);
            return Ok(invitations);
        }

        // 5. Lấy danh sách lời mời dành cho reviewer hiện tại
        [HttpGet("my-invitations")]
        [Authorize]
        public async Task<IActionResult> GetMyInvitations()
        {
            try
            {
                var userId = GetUserId();
                if (userId == "0") return Unauthorized(new { message = "Unauthorized" });

                var invitations = await _reviewerService.GetInvitationsForUserAsync(userId);
                return Ok(invitations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 6. Lấy danh sách bài báo cho Reviewer (Chỉ khi đã Accept invitation)
        [HttpGet("{conferenceId}/submissions")]
        [Authorize]
        public async Task<IActionResult> GetReviewableSubmissions(string conferenceId)
        {
            try
            {
                var userId = GetUserId();
                if (userId == "0") return Unauthorized(new { message = "Unauthorized" });

                var submissions = await _reviewerService.GetReviewableSubmissionsAsync(userId, conferenceId);
                return Ok(submissions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 7. Lấy TẤT CẢ bài báo cho Reviewer (không phân biệt hội nghị - layer 1)
        [HttpGet("my-submissions")]
        [AllowAnonymous] // Temporarily allow anonymous for testing
        public async Task<IActionResult> GetAllMySubmissions([FromQuery] string? userId = null)
        {
            try
            {
                var actualUserId = userId ?? GetUserId();
                if (actualUserId == "0") return Unauthorized(new { message = "Unauthorized" });

                var submissions = await _reviewerService.GetAllReviewableSubmissionsAsync(userId);
                return Ok(submissions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}