using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Identity.Service.Entities;

[Table("users")]
public class User
{
    [Key]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("email")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Column("username")]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Column("password_hash")]
    [MaxLength(255)]
    public string? PasswordHash { get; set; }

    [Column("full_name")]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Column("affiliation")]
    [MaxLength(255)]
    public string? Affiliation { get; set; }

    [Column("department")]
    [MaxLength(255)]
    public string? Department { get; set; }

    [Column("title")]
    [MaxLength(100)]
    public string? Title { get; set; }

    [Column("country")]
    [MaxLength(100)]
    public string? Country { get; set; }

    [Column("phone")]
    [MaxLength(20)]
    public string? Phone { get; set; }

    [Column("orcid")]
    [MaxLength(50)]
    public string? Orcid { get; set; }

    [Column("google_scholar_id")]
    [MaxLength(100)]
    public string? GoogleScholarId { get; set; }

    [Column("bio")]
    public string? Bio { get; set; }

    [Column("profile_picture_url")]
    [MaxLength(500)]
    public string? ProfilePictureUrl { get; set; }

    [Column("password_reset_token")]
    [MaxLength(255)]
    public string? PasswordResetToken { get; set; }

    [Column("password_reset_expires")]
    public DateTime? PasswordResetExpires { get; set; }

    [Column("last_login_at")]
    public DateTime? LastLoginAt { get; set; }

    [Column("last_login_ip")]
    [MaxLength(45)]
    public string? LastLoginIp { get; set; }

    [Column("login_count")]
    public int LoginCount { get; set; } = 0;

    [Column("failed_login_attempts")]
    public int FailedLoginAttempts { get; set; } = 0;

    [Column("account_locked_until")]
    public DateTime? AccountLockedUntil { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public virtual ICollection<SsoProvider> SsoProviders { get; set; } = new List<SsoProvider>();
}
