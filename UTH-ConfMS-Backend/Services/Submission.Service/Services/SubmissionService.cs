using Submission.Service.DTOs.Common;
using Submission.Service.DTOs.Requests;
using Submission.Service.DTOs.Responses;
using Submission.Service.Entities;
using Submission.Service.Interfaces;
using Submission.Service.Interfaces.Services;
using Submission.Service.DTOs.External;
using SubmissionEntity = Submission.Service.Entities.Submission;

namespace Submission.Service.Services;

public class SubmissionService : ISubmissionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<SubmissionService> _logger;
    private readonly IConferenceClient _conferenceClient;

    public SubmissionService(
        IUnitOfWork unitOfWork,
        IFileStorageService fileStorage,
        ILogger<SubmissionService> logger,
        IConferenceClient conferenceClient)
    {
        _unitOfWork = unitOfWork;
        _fileStorage = fileStorage;
        _logger = logger;
        _conferenceClient = conferenceClient;
    }

    public async Task<PagedResponse<SubmissionDto>> GetSubmissionsAsync(
        Guid? conferenceId, string? status, int page, int pageSize)
    {
        var totalCount = await _unitOfWork.Submissions.CountAsync(conferenceId, status);
        var submissions = await _unitOfWork.Submissions.GetAllAsync(conferenceId, status, (page - 1) * pageSize, pageSize);

        var items = submissions.Select(s => MapToDto(s)).ToList();

        return new PagedResponse<SubmissionDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResponse<SubmissionDto>> GetUserSubmissionsAsync(
        Guid userId, Guid? conferenceId, string? status, int page, int pageSize)
    {
        // Exclude withdrawn submissions by default
        var totalCount = await _unitOfWork.Submissions.CountByUserAsync(userId, conferenceId, status, excludeWithdrawn: true);
        var submissions = await _unitOfWork.Submissions.GetByUserAsync(userId, conferenceId, status, (page - 1) * pageSize, pageSize, excludeWithdrawn: true);

        var items = submissions.Select(s => MapToDto(s)).ToList();

        return new PagedResponse<SubmissionDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<SubmissionDetailDto> GetSubmissionByIdAsync(Guid submissionId)
    {
        var submission = await _unitOfWork.Submissions.GetByIdWithDetailsAsync(submissionId);

        if (submission == null)
        {
            throw new InvalidOperationException("Submission not found");
        }

        return new SubmissionDetailDto(
            submission.Id,
            submission.PaperNumber,
            submission.ConferenceId,
            submission.TrackId,
            submission.Title,
            submission.Abstract,
            submission.Status,
            submission.SubmittedBy,
            submission.SubmittedAt,
            submission.CreatedAt,
            submission.UpdatedAt,
            submission.Authors.OrderBy(a => a.AuthorOrder).Select(a => new AuthorDto(
                a.AuthorId,
                a.FullName,
                a.Email,
                a.Affiliation,
                a.AuthorOrder,
                a.IsCorresponding
            )).ToList(),
            submission.Files.Select(f => new FileInfoDto(
                f.FileId,
                f.FileName,
                f.FileSizeBytes,
                f.UploadedAt
            )).ToList()
        )
        {
            TrackName = GetTrackName(submission.TrackId)
        };
    }

    public async Task<SubmissionDto> CreateSubmissionAsync(CreateSubmissionRequest request, Guid submitterId)
    {
        // TODO: Check if conference is accepting submissions (call conference service)
        
        // Generate paper number
        var lastNumber = await _unitOfWork.Submissions.GetMaxSubmissionNumberAsync(request.ConferenceId) ?? 0;

        var submission = new Entities.Submission
        {
            Id = Guid.NewGuid(),
            PaperNumber = lastNumber + 1,
            ConferenceId = request.ConferenceId,
            TrackId = request.TrackId,
            Title = request.Title,
            Abstract = request.Abstract,
            Status = "SUBMITTED",
            SubmittedBy = submitterId,
            SubmittedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Submissions.CreateAsync(submission);

        // Add authors
        var authors = request.Authors.Select(authorReq => new Author
        {
            AuthorId = Guid.NewGuid(),
            SubmissionId = submission.Id,
            FullName = authorReq.FullName,
            Email = authorReq.Email,
            Affiliation = authorReq.Affiliation,
            AuthorOrder = authorReq.OrderIndex,
            IsCorresponding = authorReq.IsCorresponding,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        await _unitOfWork.Authors.CreateRangeAsync(authors);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Submission #{Number} created for conference {ConferenceId}",
            submission.PaperNumber, submission.ConferenceId);

        // Reload with authors
        submission = await _unitOfWork.Submissions.GetByIdWithAuthorsAsync(submission.Id);

        // Handle file upload if provided
        if (request.File != null && request.File.Length > 0)
        {
            try 
            {
                await UploadFileAsync(submission.Id, request.File, submitterId);
                // Reload again to include file info if needed, or just rely on the fact it's saved
                // For now, MapToDto doesn't strictly require the file list unless we want to return it immediately
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload initial file for submission {SubmissionId}", submission.Id);
                // We don't rollback the submission but we log the error. 
                // Alternatively, we could throw to let the controller handle it, but the submission is technically created.
            }
        }

        return MapToDto(submission!);
    }

    public async Task<SubmissionDto> UpdateSubmissionAsync(Guid submissionId, UpdateSubmissionRequest request, Guid userId)
    {
        // Sử dụng GetByIdWithAuthorsAsync để load đầy đủ object phục vụ cho việc xóa/thay thế authors
        var submission = await _unitOfWork.Submissions.GetByIdWithAuthorsAsync(submissionId);

        if (submission == null)
        {
            throw new InvalidOperationException("Submission not found");
        }

        // Check ownership - chỉ người submit mới có quyền update
        if (submission.SubmittedBy != userId)
        {
            throw new UnauthorizedAccessException("Only the submitter can update the submission");
        }

        // Check if submission can be updated based on status
        if (submission.Status == "ACCEPTED" || submission.Status == "REJECTED" || submission.Status == "WITHDRAWN")
        {
            throw new InvalidOperationException($"Cannot update submission with status {submission.Status}");
        }

        // Check deadline - gọi Conference Service để lấy thông tin deadline
        try
        {
            var conference = await _conferenceClient.GetConferenceByIdAsync(submission.ConferenceId);
            if (DateTime.UtcNow > conference.SubmissionDeadline)
            {
                throw new InvalidOperationException("Submission deadline has passed. Cannot update submission.");
            }
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            _logger.LogError(ex, "Failed to check conference deadline for submission {SubmissionId}", submissionId);
            throw new InvalidOperationException("Unable to verify submission deadline. Please try again later.", ex);
        }

        // Update metadata
        if (request.TrackId != null) submission.TrackId = request.TrackId;
        if (request.Title != null) submission.Title = request.Title;
        if (request.Abstract != null) submission.Abstract = request.Abstract;

        // Automatically set to submitted if it was draft or being updated
        submission.Status = "SUBMITTED";
        if (submission.SubmittedAt == null) 
        {
            submission.SubmittedAt = DateTime.UtcNow;
        }

        // Update authors if provided
        if (request.Authors != null && request.Authors.Count > 0)
        {
            // Remove existing authors
            await _unitOfWork.Authors.DeleteRangeAsync(submission.Authors);

            // Add new authors
            var newAuthors = request.Authors.Select(authorReq => new Author
            {
                AuthorId = Guid.NewGuid(),
                SubmissionId = submission.Id,
                FullName = authorReq.FullName,
                Email = authorReq.Email,
                Affiliation = authorReq.Affiliation,
                AuthorOrder = authorReq.OrderIndex,
                IsCorresponding = authorReq.IsCorresponding,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await _unitOfWork.Authors.CreateRangeAsync(newAuthors);
        }

        submission.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Submission {SubmissionId} updated by user {UserId}", submission.Id, userId);

        submission = await _unitOfWork.Submissions.GetByIdWithAuthorsAsync(submission.Id);
        return MapToDto(submission!);
    }

    public async Task WithdrawSubmissionAsync(Guid submissionId, Guid userId, string reason)
    {
        var submission = await _unitOfWork.Submissions.GetByIdAsync(submissionId);
        if (submission == null)
        {
            throw new InvalidOperationException("Submission not found");
        }

        // Check if user has permission to withdraw
        if (submission.SubmittedBy != userId)
        {
            throw new UnauthorizedAccessException("Only the submitter can withdraw the submission");
        }

        submission.Status = "WITHDRAWN";
        submission.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Submission {SubmissionId} withdrawn by user {UserId}", submissionId, userId);
    }

    public async Task<FileInfoDto> UploadFileAsync(Guid submissionId, IFormFile file, Guid userId)
    {
        var submission = await _unitOfWork.Submissions.GetByIdAsync(submissionId);
        if (submission == null)
        {
            throw new InvalidOperationException("Submission not found");
        }

        var directory = $"submissions/{submission.ConferenceId}/{submissionId}";
        var filePath = await _fileStorage.SaveFileAsync(file, directory);

        var submissionFile = new SubmissionFile
        {
            FileId = Guid.NewGuid(),
            SubmissionId = submissionId,
            FileName = Path.GetFileName(filePath),
            FilePath = filePath,
            FileSizeBytes = file.Length,
            FileType = Path.GetExtension(file.FileName).TrimStart('.').ToUpper(),
            IsMainPaper = true,
            UploadedBy = userId,
            UploadedAt = DateTime.UtcNow
        };

        await _unitOfWork.SubmissionFiles.CreateAsync(submissionFile);
        submission.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        return new FileInfoDto(
            submissionFile.FileId,
            submissionFile.FileName,
            submissionFile.FileSizeBytes,
            submissionFile.UploadedAt
        );
    }

    public async Task<FileDownloadDto> DownloadFileAsync(Guid submissionId, Guid fileId)
    {
        var file = await _unitOfWork.SubmissionFiles.GetBySubmissionAndIdAsync(submissionId, fileId);

        if (file == null)
        {
            throw new FileNotFoundException("File not found");
        }

        var fileBytes = await _fileStorage.ReadFileAsync(file.FilePath);

        // Determine content type from file extension
        var contentType = file.FileType.ToUpper() switch
        {
            "PDF" => "application/pdf",
            "DOC" => "application/msword",
            "DOCX" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => "application/octet-stream"
        };

        return new FileDownloadDto(
            fileBytes,
            contentType,
            file.FileName
        );
    }

    public async Task<SubmissionStatisticsDto> GetSubmissionStatisticsAsync(Guid conferenceId)
    {
        var submissions = await _unitOfWork.Submissions.GetByConferenceAsync(conferenceId);

        var submissionsByStatus = submissions
            .GroupBy(s => s.Status)
            .ToDictionary(g => g.Key, g => g.Count());

        var submissionsByTrack = submissions
            .Where(s => s.TrackId.HasValue)
            .GroupBy(s => s.TrackId!.Value.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var avgAuthors = submissions.Count > 0
            ? submissions.Average(s => s.Authors.Count)
            : 0;

        return new SubmissionStatisticsDto(
            submissions.Count,
            submissionsByStatus,
            submissionsByTrack,
            (int)avgAuthors,
            0 // No page count in simplified schema
        );
    }

    private SubmissionDto MapToDto(Entities.Submission submission)
    {
        return new SubmissionDto(
            submission.Id,
            submission.PaperNumber,
            submission.ConferenceId,
            submission.TrackId,
            submission.Title,
            submission.Status,
            submission.SubmittedAt,
            submission.Authors.OrderBy(a => a.AuthorOrder).Select(a => new AuthorDto(
                a.AuthorId,
                a.FullName,
                a.Email,
                a.Affiliation,
                a.AuthorOrder,
                a.IsCorresponding
            )).ToList()
        )
        {
            TrackName = GetTrackName(submission.TrackId)
        };
    }

    private string GetTrackName(Guid? trackId)
    {
        if (!trackId.HasValue) return "N/A";

        var idString = trackId.Value.ToString().ToLower();
        return idString switch
        {
            "e1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1" => "Hệ thống điều khiển thông minh",
            "e2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2" => "Trí tuệ nhân tạo và Ứng dụng",
            "e3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3" => "Hệ thống năng lượng tái tạo",
            _ => "Chủ đề khác"
        };
    }
}
