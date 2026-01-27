namespace Submission.Service.DTOs.Responses;

public record SubmissionDto(
    Guid Id,
    int? PaperNumber,
    Guid ConferenceId,
    Guid? TrackId,
    string Title,
    string Status,
    DateTime? SubmittedAt,
    List<AuthorDto> Authors
)
{
    public string? TrackName { get; set; }
}
