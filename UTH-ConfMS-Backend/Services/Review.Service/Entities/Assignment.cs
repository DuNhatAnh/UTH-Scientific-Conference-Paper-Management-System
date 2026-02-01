using System;
using System.ComponentModel.DataAnnotations;

namespace Review.Service.Entities
{
    public class Assignment
    {
        [Key]
        public Guid Id { get; set; }

        public Guid SubmissionId { get; set; }

        public Guid ReviewerId { get; set; }
        public virtual Reviewer Reviewer { get; set; } = null!;

        public Guid AssignedBy { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        public DateTime Deadline { get; set; }

        public string Status { get; set; } = "PENDING"; // PENDING, ACCEPTED, DECLINED, COMPLETED

        // Navigation property
        public PaperReview? PaperReview { get; set; }
    }
}