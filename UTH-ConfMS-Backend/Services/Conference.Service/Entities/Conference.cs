using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Conference.Service.Entities;

[Table("conferences")]
public class Conference
{
    [Key]
    [Column("conference_id")]
    public Guid ConferenceId { get; set; }

    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("acronym")]
    [MaxLength(20)]
    public string Acronym { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("location")]
    [MaxLength(255)]
    public string? Location { get; set; }

    [Column("start_date")]
    public DateTime? StartDate { get; set; }

    [Column("end_date")]
    public DateTime? EndDate { get; set; }

    [Column("submission_deadline")]
    public DateTime? SubmissionDeadline { get; set; }

    [Column("notification_date")]
    public DateTime? NotificationDate { get; set; }

    [Column("camera_ready_deadline")]
    public DateTime? CameraReadyDeadline { get; set; }

    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "DRAFT";

    [Column("visibility")]
    [MaxLength(50)]
    public string Visibility { get; set; } = "PRIVATE";

    [Column("review_mode")]
    [MaxLength(50)]
    public string? ReviewMode { get; set; }

    [Column("created_by")]
    public Guid CreatedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<ConferenceTrack> Tracks { get; set; } = new List<ConferenceTrack>();
    public virtual ICollection<ConferenceTopic> Topics { get; set; } = new List<ConferenceTopic>();
    public virtual ICollection<ConferenceDeadline> Deadlines { get; set; } = new List<ConferenceDeadline>();
    public virtual CallForPapers? CallForPapers { get; set; }
}
