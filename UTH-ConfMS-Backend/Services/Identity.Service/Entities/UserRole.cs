using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Identity.Service.Entities;

[Table("user_roles")]
public class UserRole
{
    [Key]
    [Column("user_role_id")]
    public Guid UserRoleId { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("role_id")]
    public Guid RoleId { get; set; }

    [Column("conference_id")]
    public Guid? ConferenceId { get; set; }

    [Column("track_id")]
    public Guid? TrackId { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }

    [Column("assigned_by")]
    public Guid? AssignedBy { get; set; }

    [Column("assigned_at")]
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("RoleId")]
    public virtual Role Role { get; set; } = null!;
}
