using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Review.Service.Entities;

[Table("decisions")]
public class Decision
{
    [Key]
    [Column("decision_id")]
    public Guid DecisionId { get; set; }

    [Column("submission_id")]
    public Guid SubmissionId { get; set; }

    [Column("conference_id")]
    public Guid ConferenceId { get; set; }

    [Column("decision_type")]
    [MaxLength(50)]
    public string DecisionType { get; set; } = string.Empty;

    [Column("decision_subtype")]
    [MaxLength(50)]
    public string? DecisionSubtype { get; set; }

    [Column("decision_text")]
    public string DecisionText { get; set; } = string.Empty;

    [Column("meta_review")]
    public string? MetaReview { get; set; }

    [Column("internal_notes")]
    public string? InternalNotes { get; set; }

    [Column("conditions")]
    public string? Conditions { get; set; }

    [Column("average_score", TypeName = "decimal(3,2)")]
    public decimal? AverageScore { get; set; }

    [Column("decided_by")]
    public Guid DecidedBy { get; set; }

    [Column("decided_at")]
    public DateTime DecidedAt { get; set; } = DateTime.UtcNow;

    [Column("notification_sent_at")]
    public DateTime? NotificationSentAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
