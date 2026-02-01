using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Review.Service.Entities;

[Table("reviews")]
public class PaperReview
{
    [Key]
    public Guid Id { get; set; }

    public Guid AssignmentId { get; set; }
    // Navigation property to Assignment
    public Assignment Assignment { get; set; } = null!;

    // Overall score 1-10
    [Column("overall_score")]
    public int OverallScore { get; set; }
    // Confidence 1-5
    [Column("confidence")]
    public int Confidence { get; set; }
    // Recommendation
    [Column("recommendation")]
    public string Recommendation { get; set; } = string.Empty;
    // Comments
    [Column("comments")]
    public string Comments { get; set; } = string.Empty;

    [Column("submitted_at")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}