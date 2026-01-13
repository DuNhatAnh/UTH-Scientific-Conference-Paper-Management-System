using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Review.Service.Entities;

[Table("review_assignments")]
public class ReviewAssignment
{
    [Key]
    [Column("assignment_id")]
    public Guid AssignmentId { get; set; }

    [Column("submission_id")]
    public Guid SubmissionId { get; set; }

    [Column("reviewer_id")]
    public Guid ReviewerId { get; set; }

    [Column("conference_id")]
    public Guid ConferenceId { get; set; }

    [Column("assignment_type")]
    [MaxLength(50)]
    public string AssignmentType { get; set; } = "PRIMARY";

    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "PENDING";

    [Column("invited_at")]
    public DateTime InvitedAt { get; set; } = DateTime.UtcNow;

    [Column("accepted_at")]
    public DateTime? AcceptedAt { get; set; }

    [Column("declined_at")]
    public DateTime? DeclinedAt { get; set; }

    [Column("decline_reason")]
    public string? DeclineReason { get; set; }

    [Column("review_deadline")]
    public DateTime? ReviewDeadline { get; set; }

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [Column("assignment_reason")]
    public string? AssignmentReason { get; set; }

    [Column("assigned_by")]
    public Guid? AssignedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Review? Review { get; set; }
}
