using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Identity.Service.DTOs.Common;
using Identity.Service.DTOs.Requests;
using Identity.Service.DTOs.Responses;
using Identity.Service.Interfaces.Services;

namespace Identity.Service.Controllers;

/// <summary>
/// Controller for managing user role contexts across multiple conferences
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContextController : ControllerBase
{
    private readonly IRoleContextService _roleContextService;
    private readonly ILogger<ContextController> _logger;

    public ContextController(
        IRoleContextService roleContextService,
        ILogger<ContextController> logger)
    {
        _roleContextService = roleContextService;
        _logger = logger;
    }

    /// <summary>
    /// Get all available role contexts for the current user
    /// </summary>
    /// <param name="conferenceId">Optional: Filter by specific conference</param>
    /// <returns>List of available role contexts</returns>
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableContexts([FromQuery] Guid? conferenceId = null)
    {
        try
        {
            var userId = GetUserId();
            _logger.LogInformation("Getting available contexts for user {UserId}", userId);

            var contexts = await _roleContextService.GetUserRoleContextsAsync(userId, conferenceId);

            return Ok(new ApiResponse<UserRoleContextsResponse>
            {
                Success = true,
                Message = "Available contexts retrieved successfully",
                Data = contexts
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available contexts");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Switch to a different role context
    /// </summary>
    /// <param name="request">Conference ID and role name to switch to</param>
    /// <returns>New JWT token with the selected context</returns>
    [HttpPost("switch")]
    public async Task<IActionResult> SwitchContext([FromBody] SwitchRoleContextRequest request)
    {
        try
        {
            var userId = GetUserId();
            _logger.LogInformation(
                "User {UserId} switching to {RoleName} in conference {ConferenceId}",
                userId, request.RoleName, request.ConferenceId);

            var result = await _roleContextService.SwitchRoleContextAsync(
                userId,
                request.ConferenceId,
                request.RoleName);

            return Ok(new ApiResponse<SwitchRoleContextResponse>
            {
                Success = true,
                Message = "Context switched successfully",
                Data = result
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized context switch attempt");
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid context switch operation");
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to switch context");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Validate if user has a specific role in a conference
    /// </summary>
    /// <param name="conferenceId">Conference ID</param>
    /// <param name="roleName">Role name to validate</param>
    /// <returns>Validation result</returns>
    [HttpGet("validate")]
    public async Task<IActionResult> ValidateContext(
        [FromQuery] Guid conferenceId,
        [FromQuery] string roleName)
    {
        try
        {
            var userId = GetUserId();
            _logger.LogInformation(
                "Validating {RoleName} for user {UserId} in conference {ConferenceId}",
                roleName, userId, conferenceId);

            var isValid = await _roleContextService.ValidateRoleContextAsync(
                userId,
                conferenceId,
                roleName);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = isValid ? "Role context is valid" : "Role context is invalid",
                Data = new { isValid, userId, conferenceId, roleName }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate context");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error"
            });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return userId;
    }
}
