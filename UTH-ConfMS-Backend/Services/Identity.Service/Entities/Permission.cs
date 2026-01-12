using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Identity.Service.Entities;

[Table("permissions")]
public class Permission
{
    [Key]
    [Column("permission_id")]
    public Guid PermissionId { get; set; }

    [Column("permission_name")]
    [MaxLength(100)]
    public string PermissionName { get; set; } = string.Empty;

    [Column("resource")]
    [MaxLength(100)]
    public string Resource { get; set; } = string.Empty;

    [Column("action")]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
