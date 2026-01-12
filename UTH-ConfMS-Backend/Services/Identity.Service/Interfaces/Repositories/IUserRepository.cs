using Identity.Service.Entities;

namespace Identity.Service.Interfaces.Repositories;

/// <summary>
/// Repository interface for User entity operations
/// </summary>
public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid userId);
    Task<User?> GetByIdWithRolesAsync(Guid userId);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByEmailWithRolesAsync(string email);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByPasswordResetTokenAsync(string token);
    Task<bool> EmailExistsAsync(string email);
    Task<bool> UsernameExistsAsync(string username);
    Task<User> CreateAsync(User user);
    Task UpdateAsync(User user);
    Task<List<User>> SearchUsersAsync(string query, int skip, int take);
    Task<int> CountSearchUsersAsync(string query);
}
