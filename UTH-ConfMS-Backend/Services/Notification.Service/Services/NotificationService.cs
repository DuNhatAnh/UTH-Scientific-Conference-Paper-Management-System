using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Notification.Service.Data;
using Notification.Service.DTOs.Requests;
using Notification.Service.DTOs.Responses;
using Notification.Service.Interfaces;
using Notification.Service.Entities;
using Notification.Service.Hubs;

namespace Notification.Service.Services;

public class NotificationService : INotificationService
{
    private readonly NotificationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(
        NotificationDbContext context,
        IEmailService emailService,
        ILogger<NotificationService> logger,
        IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
        _hubContext = hubContext;
    }

    public async Task<bool> SendNotificationAsync(NotificationDto notificationDto)
    {
        try
        {
            _logger.LogInformation("Sending notification to user {UserId}: {Type}", 
                notificationDto.UserId, notificationDto.Type);

            // Create notification record
            var notification = new Entities.Notification
            {
                NotificationId = Guid.NewGuid(),
                UserId = notificationDto.UserId,
                Type = notificationDto.Type,
                Title = notificationDto.Title,
                Message = notificationDto.Message,
                RelatedEntityId = notificationDto.RelatedEntityId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Push real-time notification via SignalR
            try
            {
                await _hubContext.Clients
                    .User(notificationDto.UserId.ToString())
                    .SendAsync("ReceiveNotification", new
                    {
                        id = notification.NotificationId,
                        type = notification.Type,
                        title = notification.Title,
                        message = notification.Message,
                        relatedEntityId = notification.RelatedEntityId,
                        isRead = notification.IsRead,
                        createdAt = notification.CreatedAt
                    });
                
                _logger.LogInformation("SignalR notification sent to user {UserId}", notificationDto.UserId);
            }
            catch (Exception signalREx)
            {
                // Don't fail the entire operation if SignalR fails
                _logger.LogWarning(signalREx, "Failed to send SignalR notification to user {UserId}", notificationDto.UserId);
            }

            // Send email if requested
            if (notificationDto.SendEmail && !string.IsNullOrEmpty(notificationDto.Email))
            {
                var emailRequest = new EmailRequest
                {
                    ToEmail = notificationDto.Email,
                    Subject = notificationDto.Title,
                    Body = notificationDto.Message,
                    IsHtml = true
                };

                await _emailService.SendEmailAsync(emailRequest);
            }

            _logger.LogInformation("Notification sent successfully to user {UserId}", notificationDto.UserId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification to user {UserId}", notificationDto.UserId);
            return false;
        }
    }

    public async Task<bool> SendBulkNotificationsAsync(List<NotificationDto> notifications)
    {
        _logger.LogInformation("Sending bulk notifications. Count: {Count}", notifications.Count);

        var tasks = notifications.Select(SendNotificationAsync);
        var results = await Task.WhenAll(tasks);

        var successCount = results.Count(r => r);
        _logger.LogInformation("Bulk notifications completed. Success: {Success}/{Total}", 
            successCount, notifications.Count);

        return successCount == notifications.Count;
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, int page, int pageSize)
    {
        _logger.LogInformation("Getting notifications for user {UserId}, page {Page}", userId, page);

        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                NotificationId = n.NotificationId,
                UserId = n.UserId,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                ActionUrl = n.ActionUrl,
                RelatedEntityId = n.RelatedEntityId,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                ReadAt = n.ReadAt
            })
            .ToListAsync();

        return notifications;
    }

    public async Task<bool> MarkAsReadAsync(Guid notificationId)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId);

            if (notification == null)
            {
                _logger.LogWarning("Notification {NotificationId} not found", notificationId);
                return false;
            }

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Notification {NotificationId} marked as read", notificationId);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark notification {NotificationId} as read", notificationId);
            return false;
        }
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();
    }

    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationRequest request)
    {
        try
        {
            _logger.LogInformation("Creating notification for user {UserId}: {Type}", 
                request.UserId, request.Type);

            var notification = new Entities.Notification
            {
                NotificationId = Guid.NewGuid(),
                UserId = request.UserId,
                Type = request.Type,
                Title = request.Title,
                Message = request.Message,
                ActionUrl = request.ActionUrl,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Push real-time notification via SignalR
            try
            {
                await _hubContext.Clients
                    .User(request.UserId.ToString())
                    .SendAsync("ReceiveNotification", new
                    {
                        id = notification.NotificationId,
                        type = notification.Type,
                        title = notification.Title,
                        message = notification.Message,
                        actionUrl = notification.ActionUrl,
                        isRead = notification.IsRead,
                        createdAt = notification.CreatedAt
                    });
                
                _logger.LogInformation("SignalR notification sent to user {UserId}", request.UserId);
            }
            catch (Exception signalREx)
            {
                _logger.LogWarning(signalREx, "Failed to send SignalR notification to user {UserId}", request.UserId);
            }

            _logger.LogInformation("Notification created successfully for user {UserId}", request.UserId);

            return new NotificationDto
            {
                Id = notification.NotificationId,
                UserId = notification.UserId,
                Type = notification.Type,
                Title = notification.Title,
                Message = notification.Message,
                ActionUrl = notification.ActionUrl,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create notification for user {UserId}", request.UserId);
            throw;
        }
    }

    public async Task<bool> SendEmailAsync(EmailRequest request)
    {
        return await _emailService.SendEmailAsync(request);
    }
}
