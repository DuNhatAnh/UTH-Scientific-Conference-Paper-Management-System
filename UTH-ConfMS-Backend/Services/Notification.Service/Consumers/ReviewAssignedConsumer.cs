using MassTransit;
using Notification.Service.DTOs.Requests; // Added
using Notification.Service.Interfaces;
using UTH.ConfMS.Shared.Infrastructure.EventBus;

namespace Notification.Service.Consumers
{
    /// <summary>
    /// Consumer for ReviewAssignedEvent - notifies reviewer of new assignment
    /// </summary>
    public class ReviewAssignedConsumer : IConsumer<ReviewAssignedEvent>
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<ReviewAssignedConsumer> _logger;

        public ReviewAssignedConsumer(
            INotificationService notificationService,
            ILogger<ReviewAssignedConsumer> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<ReviewAssignedEvent> context)
        {
            var message = context.Message;
            _logger.LogInformation(
                "Processing ReviewAssignedEvent for Review {ReviewId}, Reviewer {ReviewerId}",
                message.ReviewId, message.ReviewerId);

            try
            {
                // Create in-app notification
                await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
                {
                    UserId = message.ReviewerId,
                    Type = "REVIEW",
                    Title = "New Paper Assigned for Review",
                    Message = $"You have been assigned to review the paper \"{message.PaperTitle}\" for {message.ConferenceName}.",
                    ActionUrl = $"/reviewer/reviews/{message.ReviewId}"
                });

                // Send assignment email
                var deadlineText = message.DeadlineAt.HasValue 
                    ? $"<p><strong>Review Deadline:</strong> {message.DeadlineAt.Value:yyyy-MM-dd HH:mm}</p>"
                    : "";

                var emailBody = $@"
                    <h2>Paper Review Assignment</h2>
                    <p>Dear {message.ReviewerName},</p>
                    <p>You have been assigned to review a paper for <strong>{message.ConferenceName}</strong>.</p>
                    <p><strong>Paper Title:</strong> {message.PaperTitle}</p>
                    {deadlineText}
                    <p>Please log in to the system to access the paper and submit your review.</p>
                    <p>Thank you for your contribution to the conference!</p>
                ";

                await _notificationService.SendEmailAsync(new EmailRequest
                {
                    ToEmail = message.ReviewerEmail,
                    Subject = $"Paper Review Assignment - {message.ConferenceName}",
                    Body = emailBody,
                    IsHtml = true
                });

                _logger.LogInformation("Successfully processed ReviewAssignedEvent for {ReviewId}", message.ReviewId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing ReviewAssignedEvent for {ReviewId}", message.ReviewId);
                throw;
            }
        }
    }
}
