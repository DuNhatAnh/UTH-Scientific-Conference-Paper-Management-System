using Microsoft.AspNetCore.Http;
using Submission.Service.DTOs.Common;
using Submission.Service.DTOs.Requests;
using Submission.Service.DTOs.Responses;

namespace Submission.Service.Interfaces.Services;

public interface ISubmissionService
{
    Task<PagedResponse<SubmissionDto>> GetSubmissionsAsync(Guid? conferenceId, string? status, int page, int pageSize);
    Task<PagedResponse<SubmissionDto>> GetUserSubmissionsAsync(Guid userId, Guid? conferenceId, string? status, int page, int pageSize);
    Task<SubmissionDetailDto> GetSubmissionByIdAsync(Guid submissionId);
    Task<SubmissionDto> CreateSubmissionAsync(CreateSubmissionRequest request, Guid submitterId);
    Task<SubmissionDto> UpdateSubmissionAsync(Guid submissionId, UpdateSubmissionRequest request, Guid userId);
    Task WithdrawSubmissionAsync(Guid submissionId, Guid userId, string reason);
    Task UpdateStatusAsync(Guid submissionId, string status);
    Task<FileInfoDto> UploadFileAsync(Guid submissionId, IFormFile file, Guid userId, string fileType = "PAPER");
    Task<FileDownloadDto> DownloadFileAsync(Guid submissionId, Guid fileId);
    Task<SubmissionStatisticsDto> GetSubmissionStatisticsAsync(Guid conferenceId);
}
