namespace Identity.Service.DTOs.Responses;

public class RoleDto
{
    public Guid Id { get; set; }
    public Guid RoleId { get => Id; set => Id = value; }
    public string Name { get; set; } = string.Empty;
    public string RoleName { get => Name; set => Name = value; }
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystemRole { get; set; }
    public string RoleLevel { get; set; } = string.Empty;
    public Guid? ConferenceId { get; set; }
    public Guid? TrackId { get; set; }
    public bool IsActive { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
