using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Review.Service.Entities
{
    // Class này định nghĩa bảng Reviews trong Database
    public class Review
    {
        [Key]
        public int Id { get; set; }

        public int AssignmentId { get; set; }
        
        [ForeignKey("AssignmentId")]
        public virtual Assignment Assignment { get; set; }

        public int NoveltyScore { get; set; }
        public int MethodologyScore { get; set; }
        public int PresentationScore { get; set; }
        
        public string? CommentsForAuthor { get; set; }
        public string? ConfidentialComments { get; set; }
        
        public string? Recommendation { get; set; } // Accept, Reject, Revision

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}