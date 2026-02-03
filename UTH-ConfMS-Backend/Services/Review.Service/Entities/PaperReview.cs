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

    // Điểm chi tiết từng tiêu chí (1-10)
    [Column("novelty_score")]
    public int NoveltyScore { get; set; }
    
    [Column("methodology_score")]
    public int MethodologyScore { get; set; }
    
    [Column("presentation_score")]
    public int PresentationScore { get; set; }
    
    // Overall score 1-10 (trung bình của 3 điểm trên)
    [Column("overall_score")]
    public double OverallScore { get; set; }
    
    // Confidence 1-5
    [Column("confidence")]
    public int Confidence { get; set; }
    
    // Recommendation
    [Column("recommendation")]
    public string Recommendation { get; set; } = string.Empty;
    
    // Nhận xét cho tác giả (public)
    [Column("comments_for_author")]
    public string CommentsForAuthor { get; set; } = string.Empty;
    
    // Nhận xét riêng cho hội đồng (confidential)
    [Column("confidential_comments")]
    public string? ConfidentialComments { get; set; }

    [Column("submitted_at")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}