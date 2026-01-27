using System;

namespace Review.Service.DTOs;

public class InviteReviewerDTO
{
    public string ConferenceId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

public class InvitationResponseDTO
{
    public string Token { get; set; } = string.Empty;
    public bool IsAccepted { get; set; } // true = Accept, false = Decline
}

public class ReviewerDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Expertise { get; set; } = string.Empty;
}

public class ReviewableSubmissionDto
{
    public Guid Id { get; set; }
    public int PaperNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Abstract { get; set; } = string.Empty;
    public string TrackName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string SubmittedAt { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new List<string>();

    // New fields for Hierarchical View
    public string ReviewStatus { get; set; } = "None"; // None, Draft, Submitted
    public int? ReviewId { get; set; } // To link to the review form if exists
    public int? AssignmentId { get; set;} // To link to assignment if exists
    public Guid? FileId { get; set; } // Added for file download
    public long? FileSizeBytes { get; set; } // Added to display size
    public string? ConferenceId { get; set; }
    public string? ConferenceName { get; set; }
}

public class ReviewerInvitationDto
{
    public int Id { get; set; }
    public string ConferenceId { get; set; } = string.Empty;
    public string ConferenceName { get; set; } = string.Empty; // Added for UI
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}