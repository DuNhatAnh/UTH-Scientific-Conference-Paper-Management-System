namespace Conference.Service.DTOs.Requests;

public class UpdateConferenceRequest
{
    public string? Name { get; set; }
    public string? Acronym { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? SubmissionDeadline { get; set; }
    public DateTime? NotificationDate { get; set; }
    public DateTime? CameraReadyDeadline { get; set; }
    public string? Status { get; set; }
    public string? Visibility { get; set; }
}
