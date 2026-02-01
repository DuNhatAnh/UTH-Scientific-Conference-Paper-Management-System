namespace Notification.Service.DTOs.Requests;

public class CreateNotificationRequest
{
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty; // SUBMISSION, REVIEW, DECISION, SYSTEM
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ActionUrl { get; set; }
}
