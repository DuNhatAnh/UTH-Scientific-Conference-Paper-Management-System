using BCrypt.Net;
using Identity.Service.DTOs.Requests;
using Identity.Service.DTOs.Responses;
using Identity.Service.Entities;
using Identity.Service.Interfaces;
using Identity.Service.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using MassTransit;
using UTH.ConfMS.Shared.Infrastructure.EventBus;

namespace Identity.Service.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AuthService> _logger;
    private readonly IConfiguration _config;
    private readonly IPublishEndpoint _publishEndpoint;

    public AuthService(
        IUnitOfWork unitOfWork,
        IJwtTokenService jwtTokenService,
        ILogger<AuthService> logger,
        IConfiguration config,
        IPublishEndpoint publishEndpoint)
    {
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
        _config = config;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        // Find user by email with roles
        var user = await _unitOfWork.Users.GetByEmailWithRolesAsync(request.Email);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Check if account is locked
        if (user.AccountLockedUntil.HasValue && user.AccountLockedUntil.Value > DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException($"Account is locked until {user.AccountLockedUntil.Value}");
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            // Increment failed login attempts
            user.FailedLoginAttempts++;

            // Lock account after 5 failed attempts
            if (user.FailedLoginAttempts >= 5)
            {
                user.AccountLockedUntil = DateTime.UtcNow.AddMinutes(30);
                _logger.LogWarning("Account locked for user {Email} due to multiple failed login attempts", user.Email);
            }

            await _unitOfWork.SaveChangesAsync();
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Check if account is active
        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Account is inactive");
        }

        // Get user roles
        var roles = user.UserRoles
            .Where(ur => ur.IsActive && (!ur.ExpiresAt.HasValue || ur.ExpiresAt.Value > DateTime.UtcNow))
            .Select(ur => ur.Role.RoleName)
            .ToList();

        // Generate tokens
        var accessToken = _jwtTokenService.GenerateAccessToken(user, roles);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        // Save refresh token
        var refreshTokenEntity = new RefreshToken
        {
            TokenId = Guid.NewGuid(),
            UserId = user.UserId,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = "0.0.0.0" // TODO: Get actual IP
        };

        await _unitOfWork.RefreshTokens.CreateAsync(refreshTokenEntity);

        // Update user login info
        user.LastLoginAt = DateTime.UtcNow;
        user.LastLoginIp = "0.0.0.0"; // TODO: Get actual IP
        user.LoginCount++;
        user.FailedLoginAttempts = 0; // Reset failed attempts
        user.AccountLockedUntil = null; // Unlock account

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("User {Email} logged in successfully", user.Email);

        // Send welcome notification on login
        try
        {
            var loginEvent = new CreateNotificationEvent
            {
                UserId = user.UserId,
                UserEmail = user.Email,
                NotificationType = "SYSTEM",
                Title = "Welcome Back!",
                Message = $"Welcome back {user.FullName}! You have successfully logged in to UTH-ConfMS.",
                ActionUrl = roles.Contains("CHAIR") ? "/chair/dashboard" : 
                           roles.Contains("REVIEWER") ? "/reviewer/dashboard" : 
                           "/author/dashboard",
                SendEmail = false // In-app notification only for login
            };

            await _publishEndpoint.Publish(loginEvent);
            _logger.LogInformation("Published login welcome notification for user {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish login notification for user {Email}", user.Email);
            // Don't throw - login should succeed even if notification fails
        }

        var userDto = new UserDto
        {
            Id = user.UserId,
            Email = user.Email,
            Username = user.Username,
            FullName = user.FullName,
            Affiliation = user.Affiliation,
            Roles = roles
        };

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = 7200, // 2 hours in seconds
            User = userDto
        };
    }

    public async Task<UserDto> RegisterAsync(RegisterRequest request)
    {
        // Check if email already exists
        if (await _unitOfWork.Users.EmailExistsAsync(request.Email))
        {
            throw new InvalidOperationException("Email đã được đăng ký");
        }

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Create user
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = request.Email,
            Username = request.Email, // Use email as username
            PasswordHash = passwordHash,
            FullName = request.FullName,
            Affiliation = null,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Users.CreateAsync(user);

        // Assign default AUTHOR role
        var authorRole = await _unitOfWork.Roles.GetByNameAsync("AUTHOR");

        if (authorRole != null)
        {
            var userRole = new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = user.UserId,
                RoleId = authorRole.RoleId,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            };

            await _unitOfWork.Roles.CreateUserRoleAsync(userRole);
        }

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("New user registered: {Email}", user.Email);

        // Send welcome notification
        try
        {
            var welcomeEvent = new CreateNotificationEvent
            {
                UserId = user.UserId,
                UserEmail = user.Email,
                NotificationType = "SYSTEM",
                Title = "Welcome to UTH-ConfMS",
                Message = $"Welcome {user.FullName}! Thank you for registering. Manage your papers and reviews efficiently with UTH Conference Management System.",
                ActionUrl = "/author/dashboard",
                SendEmail = true,
                EmailSubject = "Welcome to UTH-ConfMS",
                EmailBody = $@"
                    <h2>Welcome to UTH Conference Management System!</h2>
                    <p>Dear {user.FullName},</p>
                    <p>Thank you for registering with UTH-ConfMS. Your account has been successfully created.</p>
                    <p><strong>Email:</strong> {user.Email}</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Submit papers to conferences</li>
                        <li>Track your submission status</li>
                        <li>Receive review feedback</li>
                        <li>Manage your profile</li>
                    </ul>
                    <p>Get started by exploring available conferences and submitting your research!</p>
                    <p>Best regards,<br/>UTH-ConfMS Team</p>
                "
            };

            await _publishEndpoint.Publish(welcomeEvent);
            _logger.LogInformation("Published welcome notification for user {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish welcome notification for user {Email}", user.Email);
            // Don't throw - registration should succeed even if notification fails
        }

        return new UserDto
        {
            Id = user.UserId,
            Email = user.Email,
            Username = user.Username,
            FullName = user.FullName,
            Affiliation = user.Affiliation,
            Roles = new List<string> { "AUTHOR" }
        };
    }

    public async Task<LoginResponse> RefreshTokenAsync(string refreshToken)
    {
        // Find refresh token with user
        var tokenEntity = await _unitOfWork.RefreshTokens.GetByTokenWithUserAsync(refreshToken);

        if (tokenEntity == null || !tokenEntity.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        var user = tokenEntity.User;

        // Get user roles
        var roles = user.UserRoles
            .Where(ur => ur.IsActive)
            .Select(ur => ur.Role.RoleName)
            .ToList();

        // Generate new tokens
        var newAccessToken = _jwtTokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();

        // Revoke old refresh token
        tokenEntity.RevokedAt = DateTime.UtcNow;
        tokenEntity.ReplacedByToken = newRefreshToken;

        // Create new refresh token
        var newTokenEntity = new RefreshToken
        {
            TokenId = Guid.NewGuid(),
            UserId = user.UserId,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = "0.0.0.0" // TODO: Get actual IP
        };

        await _unitOfWork.RefreshTokens.CreateAsync(newTokenEntity);
        await _unitOfWork.SaveChangesAsync();

        var userDto = new UserDto
        {
            Id = user.UserId,
            Email = user.Email,
            Username = user.Username,
            FullName = user.FullName,
            Affiliation = user.Affiliation,
            Roles = roles
        };

        return new LoginResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresIn = 7200,
            User = userDto
        };
    }

    public async Task LogoutAsync(Guid userId)
    {
        // Revoke all active refresh tokens for the user
        await _unitOfWork.RefreshTokens.RevokeAllUserTokensAsync(userId);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("User {UserId} logged out", userId);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        // Verify old password
        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Current password is incorrect");
        }

        // Hash new password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        // Revoke all refresh tokens (force re-login)
        await _unitOfWork.RefreshTokens.RevokeAllUserTokensAsync(userId);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("User {UserId} changed password", userId);
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(email);

        if (user == null)
        {
            // Don't reveal whether user exists
            return;
        }

        // Generate reset token
        user.PasswordResetToken = Guid.NewGuid().ToString();
        user.PasswordResetExpires = DateTime.UtcNow.AddHours(1);

        await _unitOfWork.SaveChangesAsync();

        // TODO: Send password reset email
        _logger.LogInformation("Password reset requested for {Email}", email);
    }
}
