using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Submission.Service.Entities;

[Table("submissions")]
public class Submission
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("conference_id")]
    public Guid ConferenceId { get; set; }

    [Column("track_id")]
    public Guid? TrackId { get; set; }

    [Column("paper_number")]
    public int? PaperNumber { get; set; }

    [Column("title")]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [Column("abstract")]
    public string Abstract { get; set; } = string.Empty;

    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "DRAFT";

    [Column("submitted_by")]
    public Guid SubmittedBy { get; set; }

    [Column("submitted_at")]
    public DateTime? SubmittedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Author> Authors { get; set; } = new List<Author>();
    public virtual ICollection<SubmissionFile> Files { get; set; } = new List<SubmissionFile>();
}
