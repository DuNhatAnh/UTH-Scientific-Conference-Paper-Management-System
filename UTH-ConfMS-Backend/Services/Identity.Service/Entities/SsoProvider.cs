using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Identity.Service.Entities;

[Table("sso_providers")]
public class SsoProvider
{
    [Key]
    [Column("sso_id")]
    public Guid SsoId { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("provider_name")]
    [MaxLength(50)]
    public string ProviderName { get; set; } = string.Empty;

    [Column("provider_user_id")]
    [MaxLength(255)]
    public string ProviderUserId { get; set; } = string.Empty;

    [Column("access_token")]
    public string? AccessToken { get; set; }

    [Column("refresh_token")]
    public string? RefreshToken { get; set; }

    [Column("token_expires_at")]
    public DateTime? TokenExpiresAt { get; set; }

    [Column("linked_at")]
    public DateTime LinkedAt { get; set; } = DateTime.UtcNow;

    [Column("last_used_at")]
    public DateTime? LastUsedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
