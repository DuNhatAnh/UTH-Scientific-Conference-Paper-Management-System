using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Conference.Service.DTOs.Common;
using Conference.Service.DTOs.Requests;
using Conference.Service.DTOs.Responses;
using Conference.Service.Interfaces.Services;

namespace Conference.Service.Controllers;

[ApiController]
[Route("api/conferences/{conferenceId:guid}/members")]
[Authorize]
public class CommitteeController : ControllerBase
{
    private readonly IConferenceService _conferenceService;
    private readonly ILogger<CommitteeController> _logger;

    public CommitteeController(IConferenceService conferenceService, ILogger<CommitteeController> logger)
    {
        _conferenceService = conferenceService;
        _logger = logger;
    }

    /// <summary>
    /// Get all committee members (reviewers) for a conference
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMembers(Guid conferenceId)
    {
        try
        {
            var members = await _conferenceService.GetCommitteeMembersAsync(conferenceId);
            return Ok(new ApiResponse<List<CommitteeMemberDto>>
            {
                Success = true,
                Data = members
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get members failed for conference {ConferenceId}", conferenceId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Add a existing user as Reviewer
    /// </summary>
    [HttpPost]
    // [Authorize(Policy = "RequireConferenceManage")] // Add policy later
    public async Task<IActionResult> AddMember(Guid conferenceId, [FromBody] AddCommitteeMemberRequest request)
    {
        try
        {
            var member = await _conferenceService.AddCommitteeMemberAsync(conferenceId, request);
            return Ok(new ApiResponse<CommitteeMemberDto>
            {
                Success = true,
                Message = "Member added successfully",
                Data = member
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Add member failed");
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Remove a member from committee
    /// </summary>
    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid conferenceId, Guid userId)
    {
        try
        {
            await _conferenceService.RemoveCommitteeMemberAsync(conferenceId, userId);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Member removed successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Remove member failed");
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
}
