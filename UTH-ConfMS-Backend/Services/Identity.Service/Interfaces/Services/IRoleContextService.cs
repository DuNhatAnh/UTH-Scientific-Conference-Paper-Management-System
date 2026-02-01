using Identity.Service.DTOs.Responses;

namespace Identity.Service.Interfaces.Services
{
    public interface IRoleContextService
    {
        /// <summary>
        /// Get all available role contexts for a user
        /// </summary>
        Task<UserRoleContextsResponse> GetUserRoleContextsAsync(Guid userId, Guid? conferenceId = null);

        /// <summary>
        /// Switch user's active role context and generate new JWT token
        /// </summary>
        Task<SwitchRoleContextResponse> SwitchRoleContextAsync(Guid userId, Guid conferenceId, string roleName);

        /// <summary>
        /// Validate if user has access to a specific role in a conference
        /// </summary>
        Task<bool> ValidateRoleContextAsync(Guid userId, Guid conferenceId, string roleName);
    }
}
