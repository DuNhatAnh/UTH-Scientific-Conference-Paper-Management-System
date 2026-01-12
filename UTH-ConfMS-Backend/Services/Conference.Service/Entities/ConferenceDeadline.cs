using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Conference.Service.Entities;

[Table("conference_deadlines")]
public class ConferenceDeadline
{
    [Key]
    [Column("deadline_id")]
    public Guid DeadlineId { get; set; }

    [Column("conference_id")]
    public Guid ConferenceId { get; set; }

    [Column("deadline_type")]
    [MaxLength(50)]
    public string DeadlineType { get; set; } = string.Empty;

    [Column("name")]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("deadline_date")]
    public DateTime DeadlineDate { get; set; }

    [Column("timezone")]
    [MaxLength(50)]
    public string Timezone { get; set; } = "UTC";

    [Column("is_hard_deadline")]
    public bool IsHardDeadline { get; set; } = false;

    [Column("grace_period_hours")]
    public int GracePeriodHours { get; set; } = 0;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ConferenceId")]
    public virtual Conference Conference { get; set; } = null!;
}
