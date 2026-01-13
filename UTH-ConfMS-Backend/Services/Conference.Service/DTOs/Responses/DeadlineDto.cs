namespace Conference.Service.DTOs.Responses;

public class DeadlineDto
{
    public Guid DeadlineId { get; set; }
    public Guid ConferenceId { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
