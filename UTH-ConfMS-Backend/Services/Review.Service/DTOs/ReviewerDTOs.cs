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

public class ReviewableSubmissionDto
{
    public Guid Id { get; set; }
    public int PaperNumber { get; set; }
    public string Title { get; set; }
    public string Abstract { get; set; }
    public string TrackName { get; set; }
    public string FileName { get; set; }
    public string SubmittedAt { get; set; }
    public List<string> Authors { get; set; } = new List<string>();

    // New fields for Hierarchical View
    public string ReviewStatus { get; set; } = "None"; // None, Draft, Submitted
    public int? ReviewId { get; set; } // To link to the review form if exists
    public int? AssignmentId { get; set;} // To link to assignment if exists
}

public class ReviewerInvitationDto
{
    public int Id { get; set; }
    public string ConferenceId { get; set; }
    public string ConferenceName { get; set; } // Added for UI
    public string Email { get; set; }
    public string FullName { get; set; }
    public string Status { get; set; }
    public string Token { get; set; }
    public DateTime SentAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}