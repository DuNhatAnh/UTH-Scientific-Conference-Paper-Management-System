using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Review.Service.Entities;

[Table("reviews")]
public class Review
{
    [Key]
    [Column("review_id")]
    public Guid ReviewId { get; set; }

    [Column("assignment_id")]
    public Guid AssignmentId { get; set; }

    [Column("submission_id")]
    public Guid SubmissionId { get; set; }

    [Column("reviewer_id")]
    public Guid ReviewerId { get; set; }

    [Column("overall_score", TypeName = "decimal(3,2)")]
    public decimal? OverallScore { get; set; }

    [Column("recommendation")]
    [MaxLength(50)]
    public string? Recommendation { get; set; }

    [Column("confidence_level")]
    public int? ConfidenceLevel { get; set; }

    [Column("originality_score")]
    public int? OriginalityScore { get; set; }

    [Column("technical_quality_score")]
    public int? TechnicalQualityScore { get; set; }

    [Column("clarity_score")]
    public int? ClarityScore { get; set; }

    [Column("relevance_score")]
    public int? RelevanceScore { get; set; }

    [Column("summary")]
    public string? Summary { get; set; }

    [Column("strengths")]
    public string? Strengths { get; set; }

    [Column("weaknesses")]
    public string? Weaknesses { get; set; }

    [Column("detailed_comments")]
    public string? DetailedComments { get; set; }

    [Column("confidential_comments")]
    public string? ConfidentialComments { get; set; }

    [Column("questions_for_authors")]
    public string? QuestionsForAuthors { get; set; }

    [Column("time_spent_minutes")]
    public int? TimeSpentMinutes { get; set; }

    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "DRAFT";

    [Column("submitted_at")]
    public DateTime? SubmittedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("AssignmentId")]
    public virtual ReviewAssignment Assignment { get; set; } = null!;
}
