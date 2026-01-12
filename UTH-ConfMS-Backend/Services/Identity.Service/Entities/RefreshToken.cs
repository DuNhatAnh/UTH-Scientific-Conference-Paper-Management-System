using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Identity.Service.Entities;

[Table("refresh_tokens")]
public class RefreshToken
{
    [Key]
    [Column("token_id")]
    public Guid TokenId { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("token")]
    [MaxLength(500)]
    public string Token { get; set; } = string.Empty;

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("revoked_at")]
    public DateTime? RevokedAt { get; set; }

    [Column("revoked_by_ip")]
    [MaxLength(45)]
    public string? RevokedByIp { get; set; }

    [Column("replaced_by_token")]
    [MaxLength(500)]
    public string? ReplacedByToken { get; set; }

    [Column("created_by_ip")]
    [MaxLength(45)]
    public string? CreatedByIp { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => RevokedAt == null && !IsExpired;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
