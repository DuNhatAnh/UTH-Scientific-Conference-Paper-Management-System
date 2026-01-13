namespace Conference.Service.DTOs.Responses;

public class TrackDto
{
    public Guid TrackId { get; set; }
    public Guid ConferenceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public string? Description { get; set; }
    public Guid? ChairUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
