using Notification.Service.DTOs.Requests;
using Notification.Service.DTOs.Responses;

namespace Notification.Service.Interfaces;

public interface INotificationService
{
    // Existing methods
    Task<bool> SendNotificationAsync(NotificationDto notification);
    Task<bool> SendBulkNotificationsAsync(List<NotificationDto> notifications);
    Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, int page, int pageSize);
    Task<bool> MarkAsReadAsync(Guid notificationId);
    Task<int> GetUnreadCountAsync(Guid userId);
    
    // New methods for event-driven notifications
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationRequest request);
    Task<bool> SendEmailAsync(EmailRequest request);
}
