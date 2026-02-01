using MassTransit;
using Notification.Service.DTOs.Requests; // Added
using Notification.Service.Interfaces;
using UTH.ConfMS.Shared.Infrastructure.EventBus;

namespace Notification.Service.Consumers
{
    /// <summary>
    /// Consumer for PaperDecisionMadeEvent - notifies author of paper decision
    /// </summary>
    public class PaperDecisionMadeConsumer : IConsumer<PaperDecisionMadeEvent>
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<PaperDecisionMadeConsumer> _logger;

        public PaperDecisionMadeConsumer(
            INotificationService notificationService,
            ILogger<PaperDecisionMadeConsumer> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<PaperDecisionMadeEvent> context)
        {
            var message = context.Message;
            _logger.LogInformation(
                "Processing PaperDecisionMadeEvent for Paper {PaperId}, Decision: {Decision}",
                message.PaperId, message.Decision);

            try
            {
                var decisionTitle = message.Decision.ToUpper() switch
                {
                    "ACCEPTED" => "Paper Accepted",
                    "REJECTED" => "Paper Not Accepted",
                    "REVISION_REQUIRED" => "Revision Required",
                    _ => "Decision Available"
                };

                var notificationMessage = message.Decision.ToUpper() switch
                {
                    "ACCEPTED" => $"Congratulations! Your paper \"{message.PaperTitle}\" has been accepted for {message.ConferenceName}.",
                    "REJECTED" => $"We regret to inform you that your paper \"{message.PaperTitle}\" was not accepted for {message.ConferenceName}.",
                    "REVISION_REQUIRED" => $"Your paper \"{message.PaperTitle}\" requires revisions for {message.ConferenceName}.",
                    _ => $"A decision has been made for your paper \"{message.PaperTitle}\"."
                };

                // Create in-app notification
                await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
                {
                    UserId = message.AuthorId,
                    Type = "DECISION",
                    Title = decisionTitle,
                    Message = notificationMessage,
                    ActionUrl = $"/author/submissions/{message.PaperId}"
                });

                // Send decision email with feedback
                var emailBody = $@"
                    <h2>{decisionTitle}</h2>
                    <p>Dear {message.AuthorName},</p>
                    <p>The review process for your paper submitted to <strong>{message.ConferenceName}</strong> is complete.</p>
                    <p><strong>Paper Title:</strong> {message.PaperTitle}</p>
                    <p><strong>Decision:</strong> <strong>{message.Decision.Replace("_", " ")}</strong></p>
                    <p><strong>Decision Date:</strong> {message.DecidedAt:yyyy-MM-dd}</p>
                    
                    {(message.Decision.ToUpper() == "ACCEPTED" ? @"
                        <p style='color: green; font-weight: bold;'>Congratulations on your acceptance!</p>
                        <p>You will receive further instructions regarding camera-ready submission and presentation details.</p>
                    " : "")}
                    
                    {(!string.IsNullOrWhiteSpace(message.Feedback) ? $@"
                        <h3>Reviewer Feedback:</h3>
                        <div style='background-color: #f5f5f5; padding: 15px; border-left: 3px solid #007bff;'>
                            {message.Feedback.Replace("\n", "<br/>")}
                        </div>
                    " : "")}
                    
                    <p>Thank you for your submission!</p>
                ";

                await _notificationService.SendEmailAsync(new EmailRequest
                {
                    ToEmail = message.AuthorEmail,
                    Subject = $"{decisionTitle} - {message.PaperTitle}",
                    Body = emailBody,
                    IsHtml = true
                });

                _logger.LogInformation("Successfully processed PaperDecisionMadeEvent for {PaperId}", message.PaperId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PaperDecisionMadeEvent for {PaperId}", message.PaperId);
                throw;
            }
        }
    }
}
