namespace Identity.Service.DTOs.Responses;

public class UserDto
{
    public Guid Id { get; set; }
    public Guid UserId { get => Id; set => Id = value; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Affiliation { get; set; }
    public string? Department { get; set; }
    public string? Title { get; set; }
    public string? Country { get; set; }
    public string? Phone { get; set; }
    public string? Orcid { get; set; }
    public string? GoogleScholarId { get; set; }
    public string? Bio { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<UserRoleDto> UserRoles { get; set; } = new();
}
