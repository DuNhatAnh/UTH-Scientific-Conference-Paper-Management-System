using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Conference.Service.DTOs.Common;
using Conference.Service.DTOs.Requests;
using Conference.Service.DTOs.Responses;
using Conference.Service.Interfaces.Services;

namespace Conference.Service.Controllers;

[ApiController]
[Route("api/conferences/{conferenceId:guid}/[controller]")]
[Authorize]
public class DeadlinesController : ControllerBase
{
    private readonly IConferenceService _conferenceService;
    private readonly ILogger<DeadlinesController> _logger;

    public DeadlinesController(IConferenceService conferenceService, ILogger<DeadlinesController> logger)
    {
        _conferenceService = conferenceService;
        _logger = logger;
    }

    /// <summary>
    /// Get all deadlines for a conference
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDeadlines(Guid conferenceId)
    {
        try
        {
            var deadlines = await _conferenceService.GetDeadlinesAsync(conferenceId);
            return Ok(new ApiResponse<List<DeadlineDto>>
            {
                Success = true,
                Data = deadlines
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get deadlines failed for conference {ConferenceId}", conferenceId);
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Conference not found"
            });
        }
    }

    /// <summary>
    /// Add a new deadline to conference
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "RequireConferenceManage")]
    public async Task<IActionResult> AddDeadline(Guid conferenceId, [FromBody] CreateDeadlineRequest request)
    {
        try
        {
            var deadline = await _conferenceService.AddDeadlineAsync(conferenceId, request);
            return Ok(new ApiResponse<DeadlineDto>
            {
                Success = true,
                Message = "Deadline added successfully",
                Data = deadline
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Add deadline failed for conference {ConferenceId}", conferenceId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
}
