using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Conference.Service.DTOs.Common;
using Conference.Service.DTOs.Requests;
using Conference.Service.DTOs.Responses;
using Conference.Service.Interfaces.Services;

namespace Conference.Service.Controllers;

[ApiController]
[Route("api/conferences/{conferenceId:guid}/cfp")]
[Authorize]
public class CallForPapersController : ControllerBase
{
    private readonly IConferenceService _conferenceService;
    private readonly ILogger<CallForPapersController> _logger;

    public CallForPapersController(IConferenceService conferenceService, ILogger<CallForPapersController> logger)
    {
        _conferenceService = conferenceService;
        _logger = logger;
    }

    /// <summary>
    /// Get Call for Papers for a conference
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetCallForPapers(Guid conferenceId)
    {
        try
        {
            var cfp = await _conferenceService.GetCallForPapersAsync(conferenceId);
            return Ok(new ApiResponse<CallForPapersDto>
            {
                Success = true,
                Data = cfp
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get CFP failed for conference {ConferenceId}", conferenceId);
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Call for Papers not found"
            });
        }
    }

    /// <summary>
    /// Update Call for Papers
    /// </summary>
    [HttpPut]
    [Authorize(Policy = "RequireConferenceManage")]
    public async Task<IActionResult> UpdateCallForPapers(Guid conferenceId, [FromBody] UpdateCallForPapersRequest request)
    {
        try
        {
            var cfp = await _conferenceService.UpdateCallForPapersAsync(conferenceId, request);
            return Ok(new ApiResponse<CallForPapersDto>
            {
                Success = true,
                Message = "Call for Papers updated successfully",
                Data = cfp
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Update CFP failed for conference {ConferenceId}", conferenceId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
}
