using MassTransit;
using Notification.Service.DTOs.Requests; // Added
using Notification.Service.Interfaces;
using UTH.ConfMS.Shared.Infrastructure.EventBus;

namespace Notification.Service.Consumers
{
    /// <summary>
    /// Consumer for ReviewCompletedEvent - notifies chairs when review is complete
    /// </summary>
    public class ReviewCompletedConsumer : IConsumer<ReviewCompletedEvent>
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<ReviewCompletedConsumer> _logger;

        public ReviewCompletedConsumer(
            INotificationService notificationService,
            ILogger<ReviewCompletedConsumer> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<ReviewCompletedEvent> context)
        {
            var message = context.Message;
            _logger.LogInformation(
                "Processing ReviewCompletedEvent for Review {ReviewId}, Paper {PaperId}",
                message.ReviewId, message.PaperId);

            try
            {
                // Notify all chairs about completed review
                foreach (var (chairId, chairEmail) in message.ChairIdsToNotify.Zip(message.ChairEmailsToNotify))
                {
                    // Create in-app notification for chair
                    await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
                    {
                        UserId = chairId,
                        Type = "REVIEW",
                        Title = "Review Completed",
                        Message = $"A review has been completed for paper \"{message.PaperTitle}\" in {message.ConferenceName}.",
                        ActionUrl = $"/chair/papers/{message.PaperId}/reviews"
                    });

                    // Send email to chair
                    var emailBody = $@"
                        <h2>Review Completion Notification</h2>
                        <p>A review has been completed for the following paper:</p>
                        <p><strong>Paper Title:</strong> {message.PaperTitle}</p>
                        <p><strong>Conference:</strong> {message.ConferenceName}</p>
                        <p><strong>Review Score:</strong> {message.Score}/5</p>
                        <p><strong>Completed On:</strong> {message.CompletedAt:yyyy-MM-dd HH:mm}</p>
                        <p>Please log in to view the full review details and manage the decision process.</p>
                    ";

                    await _notificationService.SendEmailAsync(new EmailRequest
                    {
                        ToEmail = chairEmail,
                        Subject = $"Review Completed - {message.PaperTitle}",
                        Body = emailBody,
                        IsHtml = true
                    });
                }

                _logger.LogInformation("Successfully processed ReviewCompletedEvent for {ReviewId}", message.ReviewId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing ReviewCompletedEvent for {ReviewId}", message.ReviewId);
                throw;
            }
        }
    }
}
