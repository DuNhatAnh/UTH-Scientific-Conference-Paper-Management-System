using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Review.Service.Entities;

public class PaperReview
{
    [Key]
    public int Id { get; set; }

    public int AssignmentId { get; set; }
    // Navigation property to Assignment
    public Assignment Assignment { get; set; } = null!;

    // Scores
    public int NoveltyScore { get; set; }
    public int MethodologyScore { get; set; }
    public int PresentationScore { get; set; }

    // Comments
    public string CommentsForAuthor { get; set; } = string.Empty;
    public string ConfidentialComments { get; set; } = string.Empty;

    // Decision Recommendation: Accept, Reject, Revision
    public string Recommendation { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}