using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Conference.Service.Entities;

[Table("committee_members")]
public class CommitteeMember
{
    [Key]
    [Column("member_id")]
    public Guid MemberId { get; set; }

    [Column("conference_id")]
    public Guid ConferenceId { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("role")]
    [MaxLength(50)]
    public string Role { get; set; } // CHAIR, PC_MEMBER, REVIEWER

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ConferenceId")]
    public virtual Conference Conference { get; set; } = null!;
}
