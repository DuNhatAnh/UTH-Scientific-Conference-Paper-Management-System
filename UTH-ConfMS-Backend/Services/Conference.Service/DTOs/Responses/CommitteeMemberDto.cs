namespace Conference.Service.DTOs.Responses;

public class CommitteeMemberDto
{
    public Guid MemberId { get; set; }
    public Guid ConferenceId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty; // Enriched possibly
    public string Email { get; set; } = string.Empty;    // Enriched possibly
    public DateTime CreatedAt { get; set; }
}
