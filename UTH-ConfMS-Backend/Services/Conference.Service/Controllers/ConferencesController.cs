using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Conference.Service.DTOs.Common;
using Conference.Service.DTOs.Requests;
using Conference.Service.DTOs.Responses;
using Conference.Service.Interfaces.Services;

namespace Conference.Service.Controllers;

/// <summary>
/// Controller for managing conferences (CRUD operations)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConferencesController : ControllerBase
{
    private readonly IConferenceService _conferenceService;
    private readonly ILogger<ConferencesController> _logger;

    public ConferencesController(IConferenceService conferenceService, ILogger<ConferencesController> logger)
    {
        _conferenceService = conferenceService;
        _logger = logger;
    }

    /// <summary>
    /// Get all conferences with optional filters
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetConferences(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _conferenceService.GetConferencesAsync(status, page, pageSize);
            return Ok(new ApiResponse<PagedResponse<ConferenceDto>>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get conferences failed");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Get conference by ID
    /// </summary>
    [HttpGet("{conferenceId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetConference(Guid conferenceId)
    {
        try
        {
            var conference = await _conferenceService.GetConferenceByIdAsync(conferenceId);
            return Ok(new ApiResponse<ConferenceDetailDto>
            {
                Success = true,
                Data = conference
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get conference failed for {ConferenceId}", conferenceId);
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Conference not found"
            });
        }
    }

    /// <summary>
    /// Create a new conference
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "RequireConferenceCreate")]
    public async Task<IActionResult> CreateConference([FromBody] CreateConferenceRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var conference = await _conferenceService.CreateConferenceAsync(request, Guid.Parse(userId!));
            return CreatedAtAction(
                nameof(GetConference),
                new { conferenceId = conference.ConferenceId },
                new ApiResponse<ConferenceDto>
                {
                    Success = true,
                    Message = "Conference created successfully",
                    Data = conference
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Create conference failed");
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Update an existing conference
    /// </summary>
    [HttpPut("{conferenceId:guid}")]
    [Authorize(Policy = "RequireConferenceUpdate")]
    public async Task<IActionResult> UpdateConference(Guid conferenceId, [FromBody] UpdateConferenceRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var conference = await _conferenceService.UpdateConferenceAsync(conferenceId, request, Guid.Parse(userId!));
            return Ok(new ApiResponse<ConferenceDto>
            {
                Success = true,
                Message = "Conference updated successfully",
                Data = conference
            });
        }
        catch (UnauthorizedAccessException ex)
        {
             return StatusCode(403, new ApiResponse<object>
             {
                 Success = false,
                 Message = ex.Message
             });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Update conference failed for {ConferenceId}", conferenceId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Delete a conference
    /// </summary>
    [HttpDelete("{conferenceId:guid}")]
    [Authorize(Policy = "RequireConferenceDelete")]
    public async Task<IActionResult> DeleteConference(Guid conferenceId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            await _conferenceService.DeleteConferenceAsync(conferenceId, Guid.Parse(userId!));
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Conference deleted successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
             return StatusCode(403, new ApiResponse<object>
             {
                 Success = false,
                 Message = ex.Message
             });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Delete conference failed for {ConferenceId}", conferenceId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
}
