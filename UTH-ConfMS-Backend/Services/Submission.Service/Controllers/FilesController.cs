using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Submission.Service.DTOs.Common;
using Submission.Service.DTOs.Responses;
using Submission.Service.Interfaces.Services;

namespace Submission.Service.Controllers;

/// <summary>
/// Controller for managing submission files
/// </summary>
[ApiController]
[Route("api/submissions/{submissionId:guid}/files")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly ISubmissionService _submissionService;
    private readonly ILogger<FilesController> _logger;

    public FilesController(ISubmissionService submissionService, ILogger<FilesController> logger)
    {
        _submissionService = submissionService;
        _logger = logger;
    }

    /// <summary>
    /// Get all files for a submission
    /// </summary>
    [HttpGet]
    [AllowAnonymous] // Allow Review Service to fetch files
    public async Task<IActionResult> GetFiles(Guid submissionId)
    {
        try
        {
            var submission = await _submissionService.GetSubmissionByIdAsync(submissionId);
            if (submission == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Submission not found"
                });
            }

            var files = submission.Files.Select(f => new
            {
                fileId = f.Id,
                fileName = f.FileName,
                fileSizeBytes = f.FileSizeBytes,
                fileType = f.FileType,
                uploadedAt = f.UploadedAt
            }).OrderByDescending(f => f.uploadedAt).ToList();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = files
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get files failed for submission {SubmissionId}", submissionId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Upload submission file
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> UploadFile(Guid submissionId, [FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No file provided"
                });
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var fileInfo = await _submissionService.UploadFileAsync(submissionId, file, Guid.Parse(userId!));
            return Ok(new ApiResponse<FileInfoDto>
            {
                Success = true,
                Message = "File uploaded successfully",
                Data = fileInfo
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Upload file failed for submission {SubmissionId}", submissionId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Download submission file
    /// </summary>
    [HttpGet("{fileId:guid}/download")]
    public async Task<IActionResult> DownloadFile(Guid submissionId, Guid fileId)
    {
        try
        {
            var fileData = await _submissionService.DownloadFileAsync(submissionId, fileId);
            return File(fileData.Content, fileData.ContentType, fileData.FileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Download file failed for submission {SubmissionId}, file {FileId}", submissionId, fileId);
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "File not found"
            });
        }
    }
}
