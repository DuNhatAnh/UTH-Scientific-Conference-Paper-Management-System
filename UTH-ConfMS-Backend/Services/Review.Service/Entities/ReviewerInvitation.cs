using System;
using System.ComponentModel.DataAnnotations;

namespace Review.Service.Entities;

public class ReviewerInvitation
{
    [Key]
    public int Id { get; set; }
    
    public string ConferenceId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Accepted, Declined
    public string Token { get; set; } = string.Empty; // Token xác thực duy nhất cho link mời
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
}