namespace Identity.Service.DTOs.Responses;

public class UserRoleDto
{
    public Guid UserRoleId { get; set; }
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public Guid? ConferenceId { get; set; }
    public Guid? TrackId { get; set; }
    public DateTime AssignedAt { get; set; }
}
