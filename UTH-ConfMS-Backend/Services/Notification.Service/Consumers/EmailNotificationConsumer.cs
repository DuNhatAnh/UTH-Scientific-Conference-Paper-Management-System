using MassTransit;
using Notification.Service.DTOs;
using Notification.Service.Interfaces;
using UTH.ConfMS.Shared.Infrastructure.EventBus;

namespace Notification.Service.Consumers
{
    public class EmailNotificationConsumer : IConsumer<SendEmailEvent>
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<EmailNotificationConsumer> _logger;

        public EmailNotificationConsumer(IEmailService emailService, ILogger<EmailNotificationConsumer> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<SendEmailEvent> context)
        {
            var message = context.Message;
            _logger.LogInformation("Received SendEmailEvent for {ToEmail}", message.ToEmail);

            try
            {
                var request = new EmailRequest
                {
                    ToEmail = message.ToEmail,
                    Subject = message.Subject,
                    Body = message.Body,
                    IsHtml = true 
                };

                var success = await _emailService.SendEmailAsync(request);

                if (!success)
                {
                    _logger.LogWarning("Failed to send email to {ToEmail}, but message consumed.", message.ToEmail);
                    // In a real system, you might want to schedule a retry or move to a dead-letter queue
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing SendEmailEvent");
                throw; // Throwing allows MassTransit to handle retry policies
            }
        }
    }
}
