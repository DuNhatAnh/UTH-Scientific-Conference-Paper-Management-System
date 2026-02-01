namespace Identity.Service.DTOs.Responses
{
    /// <summary>
    /// Response containing available role contexts for a user
    /// </summary>
    public class UserRoleContextDto
    {
        public Guid UserRoleId { get; set; }
        public Guid UserId { get; set; }
        public Guid RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string RoleDisplayName { get; set; } = string.Empty;
        public Guid? ConferenceId { get; set; }
        public string? ConferenceName { get; set; }
        public string? ConferenceCode { get; set; }
        public bool IsActive { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    /// <summary>
    /// Response after switching role context with new JWT token
    /// </summary>
    public class SwitchRoleContextResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public UserRoleContextDto ActiveContext { get; set; } = null!;
    }

    /// <summary>
    /// Response containing all available contexts for the user
    /// </summary>
    public class UserRoleContextsResponse
    {
        public List<UserRoleContextDto> AvailableContexts { get; set; } = new();
        public UserRoleContextDto? CurrentContext { get; set; }
    }
}
