using System;
using System.ComponentModel.DataAnnotations;

namespace Review.Service.Entities
{
    public class Assignment
    {
        [Key]
        public int Id { get; set; }

        public string PaperId { get; set; } = string.Empty;

        public int ReviewerId { get; set; }
        public virtual Reviewer Reviewer { get; set; } = null!;

        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "Pending"; // Pending, Accepted, Rejected, Completed

        // Navigation property (Dùng tên đầy đủ để tránh xung đột namespace)
        public PaperReview? PaperReview { get; set; }
    }
}