namespace Conference.Service.DTOs.Requests;

public class CreateDeadlineRequest
{
    public string Type { get; set; } = string.Empty;
    public string? DeadlineType { get; set; } // Alias for Type
    public string? Name { get; set; }
    public DateTime Date { get; set; }
    public DateTime? DeadlineDate { get; set; } // Alias for Date
    public string? Description { get; set; }
    public string? Timezone { get; set; }
    public bool? IsHardDeadline { get; set; }
    public int? GracePeriodHours { get; set; }
}
