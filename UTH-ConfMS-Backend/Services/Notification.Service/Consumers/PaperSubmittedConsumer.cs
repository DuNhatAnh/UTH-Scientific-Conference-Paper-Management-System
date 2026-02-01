using MassTransit;
using Notification.Service.DTOs.Requests; // Added
using Notification.Service.Interfaces;
using UTH.ConfMS.Shared.Infrastructure.EventBus;

namespace Notification.Service.Consumers
{
    /// <summary>
    /// Consumer for PaperSubmittedEvent - notifies author of successful submission
    /// </summary>
    public class PaperSubmittedConsumer : IConsumer<PaperSubmittedEvent>
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<PaperSubmittedConsumer> _logger;

        public PaperSubmittedConsumer(
            INotificationService notificationService,
            ILogger<PaperSubmittedConsumer> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<PaperSubmittedEvent> context)
        {
            var message = context.Message;
            _logger.LogInformation(
                "Processing PaperSubmittedEvent for Paper {PaperId} by Author {AuthorId}",
                message.PaperId, message.AuthorId);

            try
            {
                // Create in-app notification
                await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
                {
                    UserId = message.AuthorId,
                    Type = "SUBMISSION",
                    Title = "Paper Submitted Successfully",
                    Message = $"Your paper \"{message.PaperTitle}\" has been successfully submitted to {message.ConferenceName}.",
                    ActionUrl = $"/author/papers/{message.PaperId}"
                });

                // Send confirmation email
                var emailBody = $@"
                    <h2>Paper Submission Confirmation</h2>
                    <p>Dear {message.AuthorName},</p>
                    <p>Your paper has been successfully submitted to <strong>{message.ConferenceName}</strong>.</p>
                    <p><strong>Paper Title:</strong> {message.PaperTitle}</p>
                    <p><strong>Submission Date:</strong> {message.SubmittedAt:yyyy-MM-dd HH:mm}</p>
                    <p>You will be notified once the review process is complete.</p>
                    <p>Thank you for your submission!</p>
                ";

                await _notificationService.SendEmailAsync(new EmailRequest
                {
                    ToEmail = message.AuthorEmail,
                    Subject = $"Paper Submission Confirmation - {message.ConferenceName}",
                    Body = emailBody,
                    IsHtml = true
                });

                _logger.LogInformation("Successfully processed PaperSubmittedEvent for {PaperId}", message.PaperId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PaperSubmittedEvent for {PaperId}", message.PaperId);
                throw;
            }
        }
    }
}
