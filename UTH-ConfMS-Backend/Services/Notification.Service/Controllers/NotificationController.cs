using Microsoft.AspNetCore.Mvc;
using Notification.Service.DTOs;
using Notification.Service.Interfaces;

namespace Notification.Service.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(IEmailService emailService, ILogger<NotificationController> logger)
        {
            _emailService = emailService;
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
    }
}
