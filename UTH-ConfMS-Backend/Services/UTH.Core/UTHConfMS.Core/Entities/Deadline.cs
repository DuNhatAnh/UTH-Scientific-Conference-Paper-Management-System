using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UTHConfMS.Core.Entities
{
    [Table("deadline")]
    public class Deadline
    {
        [Key]
        [Column("conf_id")] // Khóa chính cũng là khóa ngoại trỏ về Conference
        public int ConfId { get; set; }

        [Column("submission_deadline")]
        public DateTime? SubmissionDeadline { get; set; }

        [Column("review_deadline")]
        public DateTime? ReviewDeadline { get; set; }

        [Column("rebuttal_deadline")]
        public DateTime? RebuttalDeadline { get; set; }

        [Column("camera_ready_deadline")]
        public DateTime? CameraReadyDeadline { get; set; }

        // Navigation
        [ForeignKey("ConfId")]
        public Conference? Conference { get; set; }
    }
}