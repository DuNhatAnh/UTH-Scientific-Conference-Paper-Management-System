using Identity.Service.Data;
using Identity.Service.Entities;
using Identity.Service.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Identity.Service.Repositories;

/// <summary>
/// Repository implementation for User entity operations
/// </summary>
public class UserRepository : IUserRepository
{
    private readonly IdentityDbContext _context;

    public UserRepository(IdentityDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    public async Task<User?> GetByIdWithRolesAsync(Guid userId)
    {
        return await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetByEmailWithRolesAsync(string email)
    {
        return await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByPasswordResetTokenAsync(string token)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.PasswordResetToken == token);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _context.Users.AnyAsync(u => u.Email == email);
    }

    public async Task<bool> UsernameExistsAsync(string username)
    {
        return await _context.Users.AnyAsync(u => u.Username == username);
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        return user;
    }

    public Task UpdateAsync(User user)
    {
        _context.Users.Update(user);
        return Task.CompletedTask;
    }

    public async Task<List<User>> SearchUsersAsync(string query, int skip, int take)
    {
        var queryLower = query.ToLower();

        return await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Where(u => u.IsActive &&
                (u.Email.ToLower().Contains(queryLower) ||
                 u.Username.ToLower().Contains(queryLower) ||
                 u.FullName.ToLower().Contains(queryLower) ||
                 (u.Affiliation != null && u.Affiliation.ToLower().Contains(queryLower))))
            .OrderBy(u => u.FullName)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<int> CountSearchUsersAsync(string query)
    {
        var queryLower = query.ToLower();

        return await _context.Users
            .Where(u => u.IsActive &&
                (u.Email.ToLower().Contains(queryLower) ||
                 u.Username.ToLower().Contains(queryLower) ||
                 u.FullName.ToLower().Contains(queryLower) ||
                 (u.Affiliation != null && u.Affiliation.ToLower().Contains(queryLower))))
            .CountAsync();
    }
}
