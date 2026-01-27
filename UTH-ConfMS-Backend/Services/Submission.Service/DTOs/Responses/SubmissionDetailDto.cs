namespace Submission.Service.DTOs.Responses;

public record SubmissionDetailDto(
    Guid Id,
    int? PaperNumber,
    Guid ConferenceId,
    Guid? TrackId,
    string Title,
    string Abstract,
    string Status,
    Guid SubmittedBy,
    DateTime? SubmittedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<AuthorDto> Authors,
    List<FileInfoDto> Files
)
{
    public string? TrackName { get; set; }
}
