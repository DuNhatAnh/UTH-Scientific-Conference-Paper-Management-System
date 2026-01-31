namespace Submission.Service.DTOs.Responses;

public record SubmissionDto(
    Guid Id,
    int? PaperNumber,
    Guid ConferenceId,
    Guid? TrackId,
    string Title,
    string Status,
    DateTime? SubmittedAt,
    List<AuthorDto> Authors,
    string? FileName = null,
    Guid? FileId = null,
    long? FileSizeBytes = null,
    DateTime? SubmissionDeadline = null
)
{
    public string? TrackName { get; set; }
}
