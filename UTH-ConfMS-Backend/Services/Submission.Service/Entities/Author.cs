using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Submission.Service.Entities;

[Table("submission_authors")]
public class Author
{
    [Key]
    [Column("author_id")]
    public Guid AuthorId { get; set; }

    [Column("submission_id")]
    public Guid SubmissionId { get; set; }

    [Column("user_id")]
    public Guid? UserId { get; set; }

    [Column("full_name")]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Column("email")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Column("affiliation")]
    [MaxLength(255)]
    public string? Affiliation { get; set; }

    [Column("author_order")]
    public int AuthorOrder { get; set; }

    [Column("is_corresponding")]
    public bool IsCorresponding { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SubmissionId")]
    public virtual Submission Submission { get; set; } = null!;
}
