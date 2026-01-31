namespace Submission.Service.DTOs.Responses;

public record FileInfoDto(
    Guid Id,
    string FileName,
    long FileSizeBytes,
    DateTime UploadedAt,
    string? FileType = null
);
