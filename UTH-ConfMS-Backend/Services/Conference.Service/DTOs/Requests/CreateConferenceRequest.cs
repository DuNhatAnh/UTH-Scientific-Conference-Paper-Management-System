namespace Conference.Service.DTOs.Requests;

public class CreateConferenceRequest
{
    public string Name { get; set; } = string.Empty;
    public string Acronym { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? SubmissionDeadline { get; set; }
    public string? ReviewMode { get; set; }
    public List<string>? Tracks { get; set; }
}
