using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UTHConfMS.Core.Entities
{
    [Table("rebuttal")]
    public class Rebuttal
    {
        [Key]
        [Column("rebuttal_id")]
        public int Id { get; set; }

        [Column("paper_id")]
        public int PaperId { get; set; }

        [Column("content")]
        public string? Content { get; set; }

        [Column("submitted_at")]
        public DateTime? SubmittedAt { get; set; }

        // Navigation
        [ForeignKey("PaperId")]
        public Paper? Paper { get; set; }
    }
}