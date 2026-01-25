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
        [Authorize(Roles = "chair,admin")]
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

        // 3. Lấy danh sách Reviewer của Conference
        [HttpGet("conference/{conferenceId}")]
        public async Task<IActionResult> GetReviewers(int conferenceId)
        {
            var reviewers = await _reviewerService.GetReviewersByConferenceAsync(conferenceId);
            return Ok(reviewers);
        }

        // 4. Lấy danh sách các lời mời đã gửi (Để Chair theo dõi trạng thái Pending/Accepted)
        [HttpGet("invitations/{conferenceId}")]
        [Authorize(Roles = "chair,admin")]
        public async Task<IActionResult> GetInvitations(int conferenceId)
        {
            var invitations = await _reviewerService.GetInvitationsByConferenceAsync(conferenceId);
            return Ok(invitations);
        }
    }
}