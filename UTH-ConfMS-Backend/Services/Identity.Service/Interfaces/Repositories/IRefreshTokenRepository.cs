using Identity.Service.Entities;

namespace Identity.Service.Interfaces.Repositories;

/// <summary>
/// Repository interface for RefreshToken entity operations
/// </summary>
public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task<RefreshToken?> GetByTokenWithUserAsync(string token);
    Task<List<RefreshToken>> GetActiveTokensByUserIdAsync(Guid userId);
    Task CreateAsync(RefreshToken refreshToken);
    Task UpdateAsync(RefreshToken refreshToken);
    Task RevokeAllUserTokensAsync(Guid userId);
}
