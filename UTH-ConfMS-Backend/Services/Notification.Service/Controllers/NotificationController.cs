using Microsoft.AspNetCore.Mvc;
using Notification.Service.DTOs.Requests;
using Notification.Service.Interfaces;

namespace Notification.Service.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(
            IEmailService emailService, 
            INotificationService notificationService,
            ILogger<NotificationController> logger)
        {
            _emailService = emailService;
            _notificationService = notificationService;
            _logger = logger;
        }

        [HttpPost("send-email")]
        public async Task<IActionResult> SendEmail([FromBody] EmailRequest request)
        {
            try
            {
                _logger.LogInformation("Received email request for {ToEmail}", request.ToEmail);
                var result = await _emailService.SendEmailAsync(request);
                
                if (result)
                {
                    return Ok(new { message = "Email sent successfully" });
                }
                
                return BadRequest(new { message = "Failed to send email" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing email request API");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetUserIdFromToken();
                if (userId == Guid.Empty) return Unauthorized(new { message = "User not found" });

                var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userId = GetUserIdFromToken();
                if (userId == Guid.Empty) return Unauthorized(new { message = "User not found" });

                var count = await _notificationService.GetUnreadCountAsync(userId);
                return Ok(new { count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread count");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            try
            {
                var result = await _notificationService.MarkAsReadAsync(id);
                if (!result) return NotFound(new { message = "Notification not found" });
                return Ok(new { message = "Marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        private Guid GetUserIdFromToken()
        {
            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value 
                              ?? User.FindFirst("sub")?.Value;
            
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return Guid.Empty;
        }
    }
}
