namespace Notification.Service.DTOs.Requests;

public class GetNotificationsRequest
{
    public Guid UserId { get; set; }
    public bool? IsRead { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
