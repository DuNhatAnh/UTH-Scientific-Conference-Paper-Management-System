using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UTHConfMS.Core.Entities
{
    [Table("paper")]
    public class Paper
    {
        [Key]
        [Column("paper_id")]
        public int Id { get; set; }

        [Column("track_id")]
        public int TrackId { get; set; }

        [Column("title")]
        public string? Title { get; set; }

        [Column("abstract")]
        public string? Abstract { get; set; }

        [Column("status")]
        public string? Status { get; set; }

        // Navigation
        [ForeignKey("TrackId")]
        public Track? Track { get; set; }
        public ICollection<PaperAuthor> Authors { get; set; } = new List<PaperAuthor>();
        public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public Rebuttal? Rebuttal { get; set; }
        public Decision? Decision { get; set; }
    }
}