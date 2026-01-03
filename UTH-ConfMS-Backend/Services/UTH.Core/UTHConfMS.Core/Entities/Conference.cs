using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UTHConfMS.Core.Entities
{
    [Table("conference")]
    public class Conference
    {
        [Key]
        [Column("conf_id")]
        public int Id { get; set; }

        [Column("name")]
        [Required]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("topic_keywords")]
        public string? TopicKeywords { get; set; }

        [Column("start_date")]
        public DateTime? StartDate { get; set; }

        [Column("end_date")]
        public DateTime? EndDate { get; set; }

        [Column("ai_enabled")]
        public bool AiEnabled { get; set; }

        // Navigation
        public Deadline? Deadline { get; set; }
        public ICollection<Track> Tracks { get; set; } = new List<Track>();
    }
}