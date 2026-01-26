using Identity.Service.Data;
using Identity.Service.Entities;
using Identity.Service.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Identity.Service.Repositories;

/// <summary>
/// Repository implementation for Role and UserRole entity operations
/// </summary>
public class RoleRepository : IRoleRepository
{
    private readonly IdentityDbContext _context;

    public RoleRepository(IdentityDbContext context)
    {
        _context = context;
    }

    // Role operations
    public async Task<Role?> GetByIdAsync(Guid roleId)
    {
        return await _context.Roles.FindAsync(roleId);
    }

    public async Task<Role?> GetByNameAsync(string roleName)
    {
        return await _context.Roles
            .FirstOrDefaultAsync(r => r.RoleName == roleName);
    }

    public async Task<List<Role>> GetAllAsync()
    {
        return await _context.Roles.Where(r => r.IsActive).ToListAsync();
    }

    public async Task AddAsync(Role role)
    {
        await _context.Roles.AddAsync(role);
    }

    public Task UpdateAsync(Role role)
    {
        _context.Roles.Update(role);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid roleId)
    {
        var role = await _context.Roles.FindAsync(roleId);
        if (role != null)
        {
            role.IsActive = false;
            _context.Roles.Update(role);
        }
    }

    // UserRole operations
    public async Task<List<UserRole>> GetUserRolesAsync(Guid userId, Guid? conferenceId = null)
    {
        var query = _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == userId && ur.IsActive);

        if (conferenceId.HasValue)
        {
            query = query.Where(ur => ur.ConferenceId == conferenceId.Value || ur.ConferenceId == null);
        }

        return await query.ToListAsync();
    }

    public async Task<List<UserRole>> GetAllUserRolesByUserIdAsync(Guid userId)
    {
        return await _context.UserRoles
            .Where(ur => ur.UserId == userId) // No IsActive filter
            .ToListAsync();
    }

    public async Task<UserRole?> GetUserRoleAsync(Guid userId, Guid roleId, Guid? conferenceId, Guid? trackId)
    {
        return await _context.UserRoles
            .FirstOrDefaultAsync(ur =>
                ur.UserId == userId &&
                ur.RoleId == roleId &&
                ur.ConferenceId == conferenceId &&
                ur.TrackId == trackId);
    }

    public async Task<List<string>> GetUserRoleNamesAsync(Guid userId)
    {
        return await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == userId && 
                         ur.IsActive && 
                         (!ur.ExpiresAt.HasValue || ur.ExpiresAt.Value > DateTime.UtcNow))
            .Select(ur => ur.Role.RoleName)
            .ToListAsync();
    }

    public async Task CreateUserRoleAsync(UserRole userRole)
    {
        await _context.UserRoles.AddAsync(userRole);
    }

    public Task UpdateUserRoleAsync(UserRole userRole)
    {
        _context.UserRoles.Update(userRole);
        return Task.CompletedTask;
    }
}
