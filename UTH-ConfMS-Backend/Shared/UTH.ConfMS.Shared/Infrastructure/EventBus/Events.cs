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
    
    // ============================================
    // PAPER SUBMISSION EVENTS
    // ============================================
    
    /// <summary>
    /// Event published when a paper is submitted
    /// </summary>
    public class PaperSubmittedEvent : IIntegrationEvent
    {
        public Guid PaperId { get; set; }
        public Guid AuthorId { get; set; }
        public string AuthorEmail { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public string PaperTitle { get; set; } = string.Empty;
        public Guid ConferenceId { get; set; }
        public string ConferenceName { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; }
    }

    /// <summary>
    /// Event published when a paper is withdrawn
    /// </summary>
    public class PaperWithdrawnEvent : IIntegrationEvent
    {
        public Guid PaperId { get; set; }
        public Guid AuthorId { get; set; }
        public string AuthorEmail { get; set; } = string.Empty;
        public string PaperTitle { get; set; } = string.Empty;
        public Guid ConferenceId { get; set; }
        public DateTime WithdrawnAt { get; set; }
    }

    // ============================================
    // REVIEW ASSIGNMENT EVENTS
    // ============================================
    
    /// <summary>
    /// Event published when a reviewer is invited
    /// </summary>
    public class ReviewerInvitedEvent : IIntegrationEvent
    {
        public Guid ReviewerId { get; set; }
        public string ReviewerEmail { get; set; } = string.Empty;
        public string ReviewerName { get; set; } = string.Empty;
        public Guid ConferenceId { get; set; }
        public string ConferenceName { get; set; } = string.Empty;
        public DateTime InvitedAt { get; set; }
        public string InvitationToken { get; set; } = string.Empty;
    }

    /// <summary>
    /// Event published when a paper is assigned to a reviewer
    /// </summary>
    public class ReviewAssignedEvent : IIntegrationEvent
    {
        public Guid ReviewId { get; set; }
        public Guid ReviewerId { get; set; }
        public string ReviewerEmail { get; set; } = string.Empty;
        public string ReviewerName { get; set; } = string.Empty;
        public Guid PaperId { get; set; }
        public string PaperTitle { get; set; } = string.Empty;
        public Guid ConferenceId { get; set; }
        public string ConferenceName { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        public DateTime? DeadlineAt { get; set; }
    }

    // ============================================
    // REVIEW COMPLETION EVENTS
    // ============================================
    
    /// <summary>
    /// Event published when a reviewer completes their review
    /// </summary>
    public class ReviewCompletedEvent : IIntegrationEvent
    {
        public Guid ReviewId { get; set; }
        public Guid ReviewerId { get; set; }
        public Guid PaperId { get; set; }
        public string PaperTitle { get; set; } = string.Empty;
        public Guid ConferenceId { get; set; }
        public string ConferenceName { get; set; } = string.Empty;
        public int Score { get; set; }
        public DateTime CompletedAt { get; set; }
        
        // Notify chair about completion
        public List<Guid> ChairIdsToNotify { get; set; } = new();
        public List<string> ChairEmailsToNotify { get; set; } = new();
    }

    // ============================================
    // DECISION EVENTS
    // ============================================
    
    /// <summary>
    /// Event published when a decision is made on a paper
    /// </summary>
    public class PaperDecisionMadeEvent : IIntegrationEvent
    {
        public Guid PaperId { get; set; }
        public string PaperTitle { get; set; } = string.Empty;
        public Guid AuthorId { get; set; }
        public string AuthorEmail { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public Guid ConferenceId { get; set; }
        public string ConferenceName { get; set; } = string.Empty;
        public string Decision { get; set; } = string.Empty; // ACCEPTED, REJECTED, REVISION_REQUIRED
        public string Feedback { get; set; } = string.Empty; // Anonymized feedback from reviews
        public DateTime DecidedAt { get; set; }
        public Guid DecidedBy { get; set; } // Chair who made the decision
    }

    /// <summary>
    /// Event published when camera-ready version is requested
    /// </summary>
    public class CameraReadyRequestedEvent : IIntegrationEvent
    {
        public Guid PaperId { get; set; }
        public string PaperTitle { get; set; } = string.Empty;
        public Guid AuthorId { get; set; }
        public string AuthorEmail { get; set; } = string.Empty;
        public Guid ConferenceId { get; set; }
        public string ConferenceName { get; set; } = string.Empty;
        public DateTime DeadlineAt { get; set; }
    }

    // ============================================
    // NOTIFICATION EVENT (Generic)
    // ============================================
    
    /// <summary>
    /// Generic event to create in-app notification and optionally send email
    /// </summary>
    public class CreateNotificationEvent : IIntegrationEvent
    {
        public Guid UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string NotificationType { get; set; } = string.Empty; // SUBMISSION, REVIEW, DECISION, SYSTEM
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ActionUrl { get; set; }
        public bool SendEmail { get; set; } = true;
        public string? EmailSubject { get; set; }
        public string? EmailBody { get; set; }
    }
}
