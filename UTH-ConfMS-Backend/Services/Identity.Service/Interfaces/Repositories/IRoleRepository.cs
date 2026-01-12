using Identity.Service.Entities;

namespace Identity.Service.Interfaces.Repositories;

/// <summary>
/// Repository interface for Role and UserRole entity operations
/// </summary>
public interface IRoleRepository
{
    // Role operations
    Task<Role?> GetByIdAsync(Guid roleId);
    Task<Role?> GetByNameAsync(string roleName);
    Task<List<Role>> GetAllAsync();
    Task AddAsync(Role role);
    Task UpdateAsync(Role role);
    Task DeleteAsync(Guid roleId);

    // UserRole operations
    Task<List<UserRole>> GetUserRolesAsync(Guid userId, Guid? conferenceId = null);
    Task<UserRole?> GetUserRoleAsync(Guid userId, Guid roleId, Guid? conferenceId, Guid? trackId);
    Task<List<string>> GetUserRoleNamesAsync(Guid userId);
    Task CreateUserRoleAsync(UserRole userRole);
    Task UpdateUserRoleAsync(UserRole userRole);
}
