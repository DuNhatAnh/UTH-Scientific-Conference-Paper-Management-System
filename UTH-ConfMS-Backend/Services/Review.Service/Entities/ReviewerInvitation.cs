using System;
using System.ComponentModel.DataAnnotations;

namespace Review.Service.Entities;

public class ReviewerInvitation
{
    [Key]
    public int Id { get; set; }
    
    public string ConferenceId { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Accepted, Declined
    public string Token { get; set; } // Token xác thực duy nhất cho link mời
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
}