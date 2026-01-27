using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Submission.Service.DTOs.Common;
using Submission.Service.DTOs.Requests;
using Submission.Service.DTOs.Responses;
using Submission.Service.Interfaces.Services;

namespace Submission.Service.Controllers;

/// <summary>
/// Controller for managing submissions (CRUD operations)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _submissionService;
    private readonly ILogger<SubmissionsController> _logger;

    public SubmissionsController(ISubmissionService submissionService, ILogger<SubmissionsController> logger)
    {
        _submissionService = submissionService;
        _logger = logger;
    }

    /// <summary>
    /// Get all submissions (with filters)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSubmissions(
        [FromQuery] Guid? conferenceId = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _submissionService.GetSubmissionsAsync(conferenceId, status, page, pageSize);
            return Ok(new ApiResponse<PagedResponse<SubmissionDto>>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get submissions failed");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Get my submissions
    /// </summary>
    [HttpGet("my-submissions")]
    public async Task<IActionResult> GetMySubmissions(
        [FromQuery] Guid? conferenceId = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var result = await _submissionService.GetUserSubmissionsAsync(Guid.Parse(userId!), conferenceId, status, page, pageSize);
            return Ok(new ApiResponse<PagedResponse<SubmissionDto>>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get my submissions failed");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Get submission by ID
    /// </summary>
    [HttpGet("{submissionId:guid}")]
    public async Task<IActionResult> GetSubmission(Guid submissionId)
    {
        try
        {
            var submission = await _submissionService.GetSubmissionByIdAsync(submissionId);
            return Ok(new ApiResponse<SubmissionDetailDto>
            {
                Success = true,
                Data = submission
            });
        }
        catch (Exception)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Submission not found"
            });
        }
    }

    /// <summary>
    /// Submit new paper (JSON body, without file - upload file separately)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "RequireSubmissionCreate")]
    public async Task<IActionResult> CreateSubmission([FromForm] CreateSubmissionRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var submission = await _submissionService.CreateSubmissionAsync(request, Guid.Parse(userId!));
            return CreatedAtAction(
                nameof(GetSubmission),
                new { submissionId = submission.Id },
                new ApiResponse<SubmissionDto>
                {
                    Success = true,
                    Message = "Paper submitted successfully",
                    Data = submission
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Create submission failed");
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Update submission
    /// </summary>
    [HttpPut("{submissionId:guid}")]
    public async Task<IActionResult> UpdateSubmission(Guid submissionId, [FromForm] UpdateSubmissionRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var submission = await _submissionService.UpdateSubmissionAsync(submissionId, request, Guid.Parse(userId!));
            return Ok(new ApiResponse<SubmissionDto>
            {
                Success = true,
                Message = "Submission updated successfully",
                Data = submission
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized update attempt for submission {SubmissionId}", submissionId);
            return StatusCode(403, new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Update submission failed for {SubmissionId}", submissionId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Withdraw submission
    /// </summary>
    [HttpPost("{submissionId:guid}/withdraw")]
    public async Task<IActionResult> WithdrawSubmission(Guid submissionId, [FromBody] WithdrawRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            await _submissionService.WithdrawSubmissionAsync(submissionId, Guid.Parse(userId!), request.Reason);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Submission withdrawn successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Withdraw submission failed for {SubmissionId}", submissionId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Update submission status (Internal/Admin)
    /// </summary>
    [HttpPut("{submissionId:guid}/status")]
    [AllowAnonymous] // Tạm thời mở cho liên lạc nội bộ giữa các service
    public async Task<IActionResult> UpdateSubmissionStatus(Guid submissionId, [FromBody] UpdateStatusRequest request)
    {
        try
        {
            await _submissionService.UpdateStatusAsync(submissionId, request.Status);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Status updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Update status failed for {SubmissionId}", submissionId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
