using Identity.Service.DTOs.Requests;
using Identity.Service.DTOs.Responses;

namespace Identity.Service.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserDto> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync(Guid userId);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task ForgotPasswordAsync(string email);
}
