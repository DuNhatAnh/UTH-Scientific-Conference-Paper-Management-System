using System;
using System.ComponentModel.DataAnnotations;

namespace Review.Service.Entities
{
    public class Assignment
    {
        [Key]
        public int Id { get; set; }

        public int PaperId { get; set; }

        public int ReviewerId { get; set; }

        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "Pending"; // Pending, Accepted, Rejected, Completed

        // Navigation property (Dùng tên đầy đủ để tránh xung đột namespace)
        public virtual Review? Review { get; set; }
    }
}