using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UTHConfMS.Core.Entities
{
    [Table("review")]
    public class Review
    {
        [Key]
        [Column("review_id")]
        public int Id { get; set; }

        [Column("assignment_id")]
        public int AssignmentId { get; set; }

        [Column("score")]
        public int? Score { get; set; }

        [Column("comments_for_author")]
        public string? CommentsForAuthor { get; set; }

        [Column("confidential_comments")]
        public string? ConfidentialComments { get; set; }

        [Column("submitted_at")]
        public DateTime? SubmittedAt { get; set; }

        // Navigation
        [ForeignKey("AssignmentId")]
        public Assignment? Assignment { get; set; }
    }
}