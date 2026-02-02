using Submission.Service.DTOs.Common;
using Submission.Service.DTOs.Requests;
using Submission.Service.DTOs.Responses;
using Submission.Service.Entities;
using Submission.Service.Interfaces;
using Submission.Service.Interfaces.Services;
using Submission.Service.DTOs.External;
using SubmissionEntity = Submission.Service.Entities.Submission;
using MassTransit;
using UTH.ConfMS.Shared.Infrastructure.EventBus;

namespace Submission.Service.Services;

public class SubmissionService : ISubmissionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<SubmissionService> _logger;
    private readonly IConferenceClient _conferenceClient;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly Dictionary<Guid, string> _trackCache = new();

    public SubmissionService(
        IUnitOfWork unitOfWork,
        IFileStorageService fileStorage,
        ILogger<SubmissionService> logger,
        IConferenceClient conferenceClient,
        IPublishEndpoint publishEndpoint)
    {
        _unitOfWork = unitOfWork;
        _fileStorage = fileStorage;
        _logger = logger;
        _conferenceClient = conferenceClient;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<PagedResponse<SubmissionDto>> GetSubmissionsAsync(
        Guid? conferenceId, string? status, int page, int pageSize, Guid? requesterId = null)
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

    public async Task<SubmissionDetailDto> GetSubmissionByIdAsync(Guid submissionId, Guid? requesterId = null)
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
            authorsDto,
            submission.Files.OrderByDescending(f => f.UploadedAt).Select(f => new FileInfoDto(
                f.FileId,
                f.FileName,
                f.FileSizeBytes,
                f.UploadedAt,
                f.FileType
            )).ToList()
        )
        {
            TrackName = GetTrackName(submission.TrackId)
        };
    }

    public async Task<SubmissionDto> CreateSubmissionAsync(CreateSubmissionRequest request, Guid submitterId)
    {
        // Check if author has reached the limit of 3 submissions per conference
        var submissionCount = await _unitOfWork.Submissions.CountByUserAsync(submitterId, request.ConferenceId, null, excludeWithdrawn: true);
        if (submissionCount >= 3)
        {
            throw new InvalidOperationException("Bạn đã đạt giới hạn tối đa nộp 3 bài báo cho hội nghị này.");
        }

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

        if (request.File != null && request.File.Length > 0)
        {
            try 
            {
                await UploadFileAsync(submission.Id, request.File, submitterId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload initial file for submission {SubmissionId}", submission.Id);
            }
        }

        // Reload with all details (authors and files) to return complete DTO
        submission = await _unitOfWork.Submissions.GetByIdWithDetailsAsync(submission.Id);

        List<TrackDto>? tracks = null;
        try 
        {
            var conference = await _conferenceClient.GetConferenceByIdAsync(submission!.ConferenceId);
            tracks = conference.Tracks;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not fetch tracks for conference {ConferenceId}", submission!.ConferenceId);
        }

        // Publish PaperSubmittedEvent to notify author
        try
        {
            // Get author info - corresponding author or first author
            var correspondingAuthor = authors.FirstOrDefault(a => a.IsCorresponding) ?? authors.FirstOrDefault();
            var conferenceName = "Conference"; // Default fallback
            
            // Try to get conference name from conference service
            try
            {
                var conference = await _conferenceClient.GetConferenceByIdAsync(submission.ConferenceId);
                conferenceName = conference?.Title ?? conferenceName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not retrieve conference name for {ConferenceId}", submission.ConferenceId);
            }

            await _publishEndpoint.Publish(new PaperSubmittedEvent
            {
                PaperId = submission.Id,
                AuthorId = submitterId,
                AuthorEmail = correspondingAuthor?.Email ?? string.Empty,
                AuthorName = correspondingAuthor?.FullName ?? "Author",
                PaperTitle = submission.Title,
                ConferenceId = submission.ConferenceId,
                ConferenceName = conferenceName,
                SubmittedAt = submission.SubmittedAt ?? DateTime.UtcNow
            });

            _logger.LogInformation("Published PaperSubmittedEvent for submission {SubmissionId}", submission.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish PaperSubmittedEvent for submission {SubmissionId}", submission.Id);
            // Don't throw - notification failure shouldn't fail the submission
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
            throw new UnauthorizedAccessException("Chỉ người nộp bài mới có quyền cập nhật bài báo này.");
        }

        // Check if if submission can be updated based on status
        if (submission.Status == "ACCEPTED" || submission.Status == "REJECTED" || submission.Status == "WITHDRAWN")
        {
            throw new InvalidOperationException($"Không thể cập nhật bài báo đang ở trạng thái {submission.Status}");
        }

        // Check deadline - call Conference Service to get deadline
        // Exception: Allow updates if status is REVISION or REVISION_REQUIRED
        try
        {
            var conference = await _conferenceClient.GetConferenceByIdAsync(submission.ConferenceId);
            if (DateTime.UtcNow > conference.SubmissionDeadline && 
                submission.Status != "REVISION" && 
                submission.Status != "REVISION_REQUIRED")
            {
                throw new InvalidOperationException("Hạn nộp bài đã qua. Không thể cập nhật bài báo.");
            }
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            _logger.LogError(ex, "Failed to check conference deadline for submission {SubmissionId}", submissionId);
            throw new InvalidOperationException("Không thể xác minh hạn nộp bài. Vui lòng thử lại sau.", ex);
        }

        // Update metadata
        if (request.TrackId != null) submission.TrackId = request.TrackId;
        if (request.Title != null) submission.Title = request.Title;
        if (request.Abstract != null) submission.Abstract = request.Abstract;

        // Handle file upload if provided (Overwrite)
        if (request.File != null && request.File.Length > 0)
        {
            await UploadFileAsync(submission.Id, request.File, userId);
        }

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
            throw new InvalidOperationException("Không tìm thấy bài báo.");
        }

        // Check if user has permission to withdraw
        if (submission.SubmittedBy != userId)
        {
            throw new UnauthorizedAccessException("Chỉ người nộp bài mới có quyền rút bài báo.");
        }

        submission.Status = "WITHDRAWN";
        submission.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Submission {SubmissionId} withdrawn by user {UserId}", submissionId, userId);
    }

    public async Task UpdateStatusAsync(Guid submissionId, string status)
    {
        var submission = await _unitOfWork.Submissions.GetByIdAsync(submissionId);
        if (submission == null)
        {
            throw new InvalidOperationException("Không tìm thấy bài báo.");
        }

        submission.Status = status.ToUpper();
        submission.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();
        _logger.LogInformation("Submission {SubmissionId} status updated to {Status}", submissionId, status);
    }

    public async Task<FileInfoDto> UploadFileAsync(Guid submissionId, IFormFile file, Guid userId, string fileType = "PAPER")
    {
        var submission = await _unitOfWork.Submissions.GetByIdAsync(submissionId);
        if (submission == null)
        {
            throw new InvalidOperationException("Không tìm thấy bài báo.");
        }

        // If uploading camera-ready, update status
        if (fileType.ToUpper() == "CAMERA_READY")
        {
            submission.Status = "CAMERA_READY";
        }

        var directory = $"submissions/{submission.ConferenceId}/{submissionId}";
        var filePath = await _fileStorage.SaveFileAsync(file, directory);

        var originalFileName = Path.GetFileName(file.FileName);
        var submissionFile = new SubmissionFile
        {
            FileId = Guid.NewGuid(),
            SubmissionId = submissionId,
            FileName = originalFileName, // Use original filename
            FilePath = filePath,
            FileSizeBytes = file.Length,
            FileType = fileType.ToUpper(),
            IsMainPaper = fileType.ToUpper() != "SUPPLEMENTARY", // Main paper or Camera-ready
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
            submissionFile.UploadedAt,
            submissionFile.FileType
        );
    }

    public async Task<FileDownloadDto> DownloadFileAsync(Guid submissionId, Guid fileId)
    {
        var file = await _unitOfWork.SubmissionFiles.GetBySubmissionAndIdAsync(submissionId, fileId);

        if (file == null)
        {
            throw new FileNotFoundException("Không tìm thấy tệp tin.");
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
        // Double-Blind logic: Mask authors if requester is not the submitter
        bool shouldMask = requesterId == null || submission.SubmittedBy != requesterId;

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
                shouldMask ? "Author Hidden" : a.FullName,
                shouldMask ? "hidden@confms.org" : a.Email,
                shouldMask ? "Hidden" : a.Affiliation,
                a.AuthorOrder,
                a.IsCorresponding
            )).ToList(),
            submission.Files.OrderByDescending(f => f.UploadedAt).FirstOrDefault()?.FileName,
            submission.Files.OrderByDescending(f => f.UploadedAt).FirstOrDefault()?.FileId,
            submission.Files.OrderByDescending(f => f.UploadedAt).FirstOrDefault()?.FileSizeBytes,
            null
        )
        {
            TrackName = GetTrackName(submission.TrackId, tracks)
        };
    }

    private async Task EnsureTrackCacheAsync(Guid conferenceId)
    {
        try
        {
            var conference = await _conferenceClient.GetConferenceByIdAsync(conferenceId);
            if (conference?.Tracks != null)
            {
                foreach (var track in conference.Tracks)
                {
                    _trackCache[track.TrackId] = track.Name;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not populate track cache for conference {ConferenceId}", conferenceId);
        }
    }

    private async Task<string> GetTrackNameAsync(Guid conferenceId, Guid? trackId)
    {
        if (!trackId.HasValue) return "N/A";

        if (_trackCache.TryGetValue(trackId.Value, out var name))
        {
            return name;
        }

        // Try to refresh cache if not found
        await EnsureTrackCacheAsync(conferenceId);

        return _trackCache.TryGetValue(trackId.Value, out var newName) ? newName : "Chủ đề khác";
    }

    private string GetTrackName(Guid? trackId, List<TrackDto>? tracks = null)
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
