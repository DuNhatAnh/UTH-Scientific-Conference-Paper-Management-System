using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UTHConfMS.Core.Entities
{
    [Table("decision")]
    public class Decision
    {
        [Key]
        [Column("decision_id")]
        public int Id { get; set; }

        [Column("paper_id")]
        public int PaperId { get; set; }

        [Column("chair_id")]
        public int? ChairId { get; set; }

        [Column("result")]
        public string? Result { get; set; }

        [Column("decision_date")]
        public DateTime? DecisionDate { get; set; }

        [Column("notification_text")]
        public string? NotificationText { get; set; }

        // Navigation
        [ForeignKey("PaperId")]
        public Paper? Paper { get; set; }

        [ForeignKey("ChairId")]
        public User? Chair { get; set; }
    }
}