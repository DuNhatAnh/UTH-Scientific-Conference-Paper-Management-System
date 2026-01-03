using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UTHConfMS.Core.Entities
{
    [Table("track")]
    public class Track
    {
        [Key]
        [Column("track_id")]
        public int Id { get; set; }

        [Column("conf_id")]
        public int ConfId { get; set; }

        [Column("name")]
        [Required]
        public string Name { get; set; } = string.Empty;

        [Column("topic_keywords")]
        public string? TopicKeywords { get; set; }

        // Navigation
        [ForeignKey("ConfId")]
        public Conference? Conference { get; set; } 
        public ICollection<Paper> Papers { get; set; } = new List<Paper>();
    }
}