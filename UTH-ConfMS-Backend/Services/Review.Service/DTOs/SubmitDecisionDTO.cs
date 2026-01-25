using System.ComponentModel.DataAnnotations;

namespace Review.Service.DTOs
{
    public class SubmitDecisionDTO
    {
        [Required]
        public string PaperId { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = string.Empty; // Accepted, Rejected, Revision

        public string? Comments { get; set; }
    }
}
