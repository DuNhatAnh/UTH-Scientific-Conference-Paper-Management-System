using Identity.Service.DTOs.Common;
using Identity.Service.DTOs.Requests;
using Identity.Service.DTOs.Responses;

namespace Identity.Service.Interfaces.Services;

public interface IUserService
{
    // User operations
    Task<UserDto> GetUserByIdAsync(Guid userId);
    Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserRequest request);
    Task<PagedResponse<UserDto>> SearchUsersAsync(string query, int page, int pageSize);
    Task<List<RoleDto>> GetUserRolesAsync(Guid userId, Guid? conferenceId);
    Task AssignRoleAsync(Guid userId, AssignRoleRequest request);
    Task RemoveRoleAsync(Guid userId, AssignRoleRequest request);
    Task SetUserRoleAsync(Guid userId, AssignRoleRequest request); // New method for atomic replace

    // Role operations
    Task<List<RoleDto>> GetAllRolesAsync();
    Task<RoleDto> GetRoleByIdAsync(Guid roleId);
    Task<RoleDto> CreateRoleAsync(CreateRoleRequest request);
    Task<RoleDto> UpdateRoleAsync(Guid roleId, UpdateRoleRequest request);
    Task DeleteRoleAsync(Guid roleId);
    Task DeleteUserAsync(Guid userId);
}
