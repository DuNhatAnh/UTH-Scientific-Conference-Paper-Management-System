namespace Notification.Service.DTOs.Responses;

public class NotificationDto
{
    public Guid Id { get; set; }
    public Guid NotificationId { get; set; } // Backward compatibility
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string? ActionUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Merged from standalone NotificationDto.cs
    public DateTime? ReadAt { get; set; }
    public bool SendEmail { get; set; }
    public string? Email { get; set; }
    public Guid? RelatedEntityId { get; set; }
}
