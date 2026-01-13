namespace Conference.Service.DTOs.Requests;

public class CreateTrackRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public string? Description { get; set; }
    public Guid? ChairUserId { get; set; }
}
