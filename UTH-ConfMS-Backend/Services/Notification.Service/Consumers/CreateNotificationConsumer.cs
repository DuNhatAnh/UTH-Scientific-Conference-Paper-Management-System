using MassTransit;
using Notification.Service.DTOs.Requests; // Added
using Notification.Service.Interfaces;
using UTH.ConfMS.Shared.Infrastructure.EventBus;

namespace Notification.Service.Consumers
{
    /// <summary>
    /// Generic consumer for creating notifications and optionally sending emails
    /// </summary>
    public class CreateNotificationConsumer : IConsumer<CreateNotificationEvent>
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<CreateNotificationConsumer> _logger;

        public CreateNotificationConsumer(
            INotificationService notificationService,
            ILogger<CreateNotificationConsumer> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<CreateNotificationEvent> context)
        {
            var message = context.Message;
            _logger.LogInformation(
                "Processing CreateNotificationEvent for User {UserId}, Type: {Type}",
                message.UserId, message.NotificationType);

            try
            {
                // Create in-app notification
                await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
                {
                    UserId = message.UserId,
                    Type = message.NotificationType,
                    Title = message.Title,
                    Message = message.Message,
                    ActionUrl = message.ActionUrl
                });

                // Send email if requested
                if (message.SendEmail && !string.IsNullOrWhiteSpace(message.UserEmail))
                {
                    await _notificationService.SendEmailAsync(new EmailRequest
                    {
                        ToEmail = message.UserEmail,
                        Subject = message.EmailSubject ?? message.Title,
                        Body = message.EmailBody ?? message.Message,
                        IsHtml = !string.IsNullOrWhiteSpace(message.EmailBody)
                    });
                }

                _logger.LogInformation("Successfully processed CreateNotificationEvent for {UserId}", message.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing CreateNotificationEvent for {UserId}", message.UserId);
                throw;
            }
        }
    }
}
