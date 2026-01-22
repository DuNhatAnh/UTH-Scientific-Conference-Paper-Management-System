using Microsoft.Extensions.Options;
using MimeKit;
using MailKit.Net.Smtp; // Lưu ý: Class SmtpClient của MailKit khác System.Net.Mail
using MailKit.Security;
using Notification.Service.DTOs;
using Notification.Service.Interfaces;
using Notification.Service.Configuration;

namespace Notification.Service.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IOptions<EmailSettings> emailSettings,
        ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(EmailRequest request)
    {
        try
        {
            _logger.LogInformation("Sending email via MailKit to {ToEmail}", request.ToEmail);

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
            message.To.Add(new MailboxAddress("", request.ToEmail));
            message.Subject = request.Subject;

            var builder = new BodyBuilder();
            if (request.IsHtml)
            {
                builder.HtmlBody = request.Body;
            }
            else
            {
                builder.TextBody = request.Body;
            }

            // Add attachments if any
            if (request.Attachments != null)
            {
                foreach (var attachment in request.Attachments)
                {
                    builder.Attachments.Add(attachment.FileName, attachment.Content);
                }
            }

            message.Body = builder.ToMessageBody();

            if (request.CcEmails != null)
            {
                foreach (var cc in request.CcEmails)
                {
                    message.Cc.Add(new MailboxAddress("", cc));
                }
            }

            using (var client = new SmtpClient())
            {
                 // Bypass certificate check for local dev if needed
                 client.CheckCertificateRevocation = false;

                 _logger.LogInformation("Connecting to SMTP {Host}:{Port}", _emailSettings.SmtpHost, _emailSettings.SmtpPort);
                 await client.ConnectAsync(_emailSettings.SmtpHost, _emailSettings.SmtpPort, SecureSocketOptions.StartTls);
                 
                 _logger.LogInformation("Authenticating with {User}", _emailSettings.SmtpUsername);
                 await client.AuthenticateAsync(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword);
                 
                 await client.SendAsync(message);
                 await client.DisconnectAsync(true);
            }

            _logger.LogInformation("Email sent successfully to {ToEmail}", request.ToEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail}: {Message}", 
                request.ToEmail, ex.Message);
            return false;
        }
    }

    public async Task<bool> SendBulkEmailAsync(List<EmailRequest> requests)
    {
        _logger.LogInformation("Sending bulk emails. Count: {Count}", requests.Count);
        var tasks = requests.Select(SendEmailAsync);
        var results = await Task.WhenAll(tasks);
        return results.All(x => x);
    }

    public async Task<bool> SendTemplateEmailAsync(string templateName, Dictionary<string, string> data, string toEmail)
    {
         // Reuse existing logic, just wrapping SendEmailAsync
         // For brevity, simple implementation for valid templates
         var template = GetEmailTemplate(templateName);
         if (template == null) return false;

         var subject = ReplacePlaceholders(template.Subject, data);
         var body = ReplacePlaceholders(template.Body, data);

         return await SendEmailAsync(new EmailRequest 
         { 
             ToEmail = toEmail, 
             Subject = subject, 
             Body = body, 
             IsHtml = template.IsHtml 
         });
    }

    // Helper methods reused from previous implementation
    private EmailTemplate? GetEmailTemplate(string templateName)
    {
        return templateName.ToLower() switch
        {
            "welcome" => new EmailTemplate { Name="welcome", Subject="Welcome {{UserName}}", Body="<h1>Welcome {{UserName}}</h1>", IsHtml=true },
            "review_assignment" => new EmailTemplate { Name="review_assignment", Subject="Assignment: {{SubmissionTitle}}", Body="<p>Review paper: {{SubmissionTitle}}</p>", IsHtml=true },
            _ => null
        };
    }

    private string ReplacePlaceholders(string text, Dictionary<string, string> data)
    {
        foreach (var (key, value) in data)
        {
            text = text.Replace($"{{{{{key}}}}}", value);
        }
        return text;
    }
}

public class EmailTemplate
{
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; }
}
