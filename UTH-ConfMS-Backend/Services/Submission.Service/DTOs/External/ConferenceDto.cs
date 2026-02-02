namespace Submission.Service.DTOs.External;

public class ConferenceDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Acronym { get; set; } = string.Empty;
    public DateTime SubmissionDeadline { get; set; }
    public List<TrackDto> Tracks { get; set; } = new();
}
