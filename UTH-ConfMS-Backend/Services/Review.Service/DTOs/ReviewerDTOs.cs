using System;

namespace Review.Service.DTOs;

public class InviteReviewerDTO
{
    public string ConferenceId { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
}

public class InvitationResponseDTO
{
    public string Token { get; set; }
    public bool IsAccepted { get; set; } // true = Accept, false = Decline
}

public class ReviewerDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string Expertise { get; set; }
}