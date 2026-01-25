using System;
using System.ComponentModel.DataAnnotations;

namespace Review.Service.Entities
{
    public class Decision
    {
        [Key]
        public int Id { get; set; }
        public string PaperId { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Accepted, Rejected, Revision
        public string? Comments { get; set; }
        public DateTime DecisionDate { get; set; } = DateTime.UtcNow;
        public int DecidedBy { get; set; } // Chair ID
    }
}