using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Identity.Service.DTOs.Common;
using Identity.Service.DTOs.Requests;
using Identity.Service.DTOs.Responses;
using Identity.Service.Interfaces.Services;

namespace Identity.Service.Controllers
{
    /// <summary>
    /// Controller for managing user role contexts across conferences
    /// Enables flexible role switching for users with multiple roles
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoleContextController : ControllerBase
    {
        private readonly IRoleContextService _roleContextService;
        private readonly ILogger<RoleContextController> _logger;

        public RoleContextController(
            IRoleContextService roleContextService,
            ILogger<RoleContextController> logger)
        {
            _roleContextService = roleContextService;
            _logger = logger;
        }

        /// <summary>
        /// Get all available role contexts for the current user
        /// </summary>
        /// <param name="conferenceId">Optional conference filter</param>
        /// <returns>List of available role contexts</returns>
        [HttpGet("contexts")]
        public async Task<IActionResult> GetAvailableContexts([FromQuery] Guid? conferenceId = null)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var contexts = await _roleContextService.GetUserRoleContextsAsync(userId, conferenceId);

                return Ok(new ApiResponse<UserRoleContextsResponse>
                {
                    Success = true,
                    Data = contexts
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting role contexts");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to retrieve role contexts"
                });
            }
        }

        /// <summary>
        /// Switch user's active role context for a specific conference
        /// Returns new JWT token with updated context
        /// </summary>
        /// <param name="request">Conference ID and desired role</param>
        /// <returns>New JWT token with updated role context</returns>
        [HttpPost("switch")]
        public async Task<IActionResult> SwitchRoleContext([FromBody] SwitchRoleContextRequest request)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                
                var response = await _roleContextService.SwitchRoleContextAsync(
                    userId, 
                    request.ConferenceId, 
                    request.RoleName);

                return Ok(new ApiResponse<SwitchRoleContextResponse>
                {
                    Success = true,
                    Message = $"Switched to {request.RoleName} role for conference",
                    Data = response
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error switching role context for user");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to switch role context"
                });
            }
        }

        /// <summary>
        /// Get current active role context from JWT token
        /// </summary>
        /// <returns>Current role context information</returns>
        [HttpGet("current")]
        public IActionResult GetCurrentContext()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var roleName = User.FindFirst(ClaimTypes.Role)?.Value;
                var conferenceId = User.FindFirst("ConferenceId")?.Value;
                var conferenceName = User.FindFirst("ConferenceName")?.Value;

                var currentContext = new
                {
                    UserId = userId,
                    RoleName = roleName,
                    ConferenceId = conferenceId != null ? Guid.Parse(conferenceId) : (Guid?)null,
                    ConferenceName = conferenceName
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Data = currentContext
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current context");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to retrieve current context"
                });
            }
        }
    }
}
