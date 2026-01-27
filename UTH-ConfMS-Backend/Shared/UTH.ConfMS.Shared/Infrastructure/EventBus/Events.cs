using MassTransit;

namespace UTH.ConfMS.Shared.Infrastructure.EventBus
{
    // Marker interface for all integration events
    public interface IIntegrationEvent { }

    // Example Event: Email Notification
    public class SendEmailEvent : IIntegrationEvent
    {
        public string ToEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }
    
    // Example Event: Review Assigned
    public class ReviewAssignedEvent : IIntegrationEvent
    {
        public int ReviewId { get; set; }
        public int ReviewerId { get; set; }
        public int PaperId { get; set; }
        public string PaperTitle { get; set; } = string.Empty;
    }
}
