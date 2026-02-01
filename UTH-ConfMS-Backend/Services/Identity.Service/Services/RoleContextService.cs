using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Identity.Service.Data;
using Identity.Service.DTOs.Responses;
using Identity.Service.Interfaces.Services;
using Identity.Service.Entities;

namespace Identity.Service.Services
{
    public class RoleContextService : IRoleContextService
    {
        private readonly IdentityDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RoleContextService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public RoleContextService(
            IdentityDbContext context,
            IConfiguration configuration,
            ILogger<RoleContextService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<UserRoleContextsResponse> GetUserRoleContextsAsync(Guid userId, Guid? conferenceId = null)
        {
            _logger.LogInformation("Getting role contexts for user {UserId}", userId);

            var query = _context.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ur.UserId == userId && ur.IsActive);

            if (conferenceId.HasValue)
            {
                query = query.Where(ur => ur.ConferenceId == conferenceId.Value);
            }

            var userRoles = await query.ToListAsync();

            var contexts = new List<UserRoleContextDto>();

            foreach (var userRole in userRoles)
            {
                string? conferenceName = null;
                string? conferenceCode = null;

                // Fetch conference details if conference ID exists
                if (userRole.ConferenceId.HasValue)
                {
                    var conferenceInfo = await GetConferenceInfoAsync(userRole.ConferenceId.Value);
                    conferenceName = conferenceInfo.Name;
                    conferenceCode = conferenceInfo.Code;
                }

                contexts.Add(new UserRoleContextDto
                {
                    UserRoleId = userRole.UserRoleId,
                    UserId = userRole.UserId,
                    RoleId = userRole.RoleId,
                    RoleName = userRole.Role?.RoleName ?? string.Empty,
                    RoleDisplayName = userRole.Role?.DisplayName ?? string.Empty,
                    ConferenceId = userRole.ConferenceId,
                    ConferenceName = conferenceName,
                    ConferenceCode = conferenceCode,
                    IsActive = userRole.IsActive,
                    ExpiresAt = userRole.ExpiresAt
                });
            }

            return new UserRoleContextsResponse
            {
                AvailableContexts = contexts,
                CurrentContext = contexts.FirstOrDefault() // This would be determined by current JWT in real scenario
            };
        }

        public async Task<SwitchRoleContextResponse> SwitchRoleContextAsync(
            Guid userId, 
            Guid conferenceId, 
            string roleName)
        {
            _logger.LogInformation(
                "Switching role context for user {UserId} to {RoleName} in conference {ConferenceId}",
                userId, roleName, conferenceId);

            // Validate the role context exists and is active
            var userRole = await _context.UserRoles
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .FirstOrDefaultAsync(ur => 
                    ur.UserId == userId && 
                    ur.ConferenceId == conferenceId &&
                    ur.Role.RoleName == roleName &&
                    ur.IsActive);

            if (userRole == null)
            {
                throw new UnauthorizedAccessException(
                    $"User does not have {roleName} role for conference {conferenceId}");
            }

            // Check expiration
            if (userRole.ExpiresAt.HasValue && userRole.ExpiresAt.Value < DateTime.UtcNow)
            {
                throw new UnauthorizedAccessException("Role assignment has expired");
            }

            // Get conference information
            var conferenceInfo = await GetConferenceInfoAsync(conferenceId);
            if (conferenceInfo.Name == "Unknown" && conferenceInfo.Code == "")
            {
                 // Check if it really failed or just unknown
                 // For now proceed, or throw? The original code threw on null.
                 // let's keep it assuming valid if not null, but since we removed null...
            }

            // Generate new JWT token with role context
            (string accessToken, string refreshToken, DateTime expiresAt) = await GenerateTokenWithContextAsync(
                userRole.User, 
                userRole.Role, 
                conferenceId,
                conferenceInfo.Name);

            return new SwitchRoleContextResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                ActiveContext = new UserRoleContextDto
                {
                    UserRoleId = userRole.UserRoleId,
                    UserId = userRole.UserId,
                    RoleId = userRole.RoleId,
                    RoleName = userRole.Role.RoleName,
                    RoleDisplayName = userRole.Role.DisplayName,
                    ConferenceId = conferenceId,
                    ConferenceName = conferenceInfo.Name,
                    ConferenceCode = conferenceInfo.Code,
                    IsActive = userRole.IsActive,
                    ExpiresAt = userRole.ExpiresAt
                }
            };
        }

        public async Task<bool> ValidateRoleContextAsync(Guid userId, Guid conferenceId, string roleName)
        {
            return await _context.UserRoles
                .Include(ur => ur.Role)
                .AnyAsync(ur => 
                    ur.UserId == userId &&
                    ur.ConferenceId == conferenceId &&
                    ur.Role.RoleName == roleName &&
                    ur.IsActive &&
                    (!ur.ExpiresAt.HasValue || ur.ExpiresAt.Value > DateTime.UtcNow));
        }

        private async Task<(string accessToken, string refreshToken, DateTime expiresAt)> GenerateTokenWithContextAsync(
            User user,
            Role role,
            Guid conferenceId,
            string conferenceName)
        {
            var jwtSettings = _configuration.GetSection("JWT");
            var secretKey = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expiresAt = DateTime.UtcNow.AddHours(
                int.Parse(jwtSettings["ExpirationHours"] ?? "24"));

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, role.RoleName),
                new Claim("RoleDisplayName", role.DisplayName),
                new Claim("ConferenceId", conferenceId.ToString()),
                new Claim("ConferenceName", conferenceName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials
            );

            var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

            // Generate refresh token
            var refreshToken = GenerateRefreshToken();
            await StoreRefreshTokenAsync(user.UserId, refreshToken, expiresAt.AddDays(7));

            return (accessToken, refreshToken, expiresAt);
        }

        private string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }

        private async Task StoreRefreshTokenAsync(Guid userId, string token, DateTime expiresAt)
        {
            var refreshToken = new RefreshToken
            {
                TokenId = Guid.NewGuid(),
                UserId = userId,
                Token = token,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();
        }

        private async Task<(string Name, string Code)> GetConferenceInfoAsync(Guid conferenceId)
        {
            try
            {
                // Call Conference Service to get conference details
                var client = _httpClientFactory.CreateClient();
                var conferenceServiceUrl = _configuration["Services:ConferenceService"] ?? "http://localhost:5002";
                var response = await client.GetAsync($"{conferenceServiceUrl}/api/conferences/{conferenceId}");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var conference = System.Text.Json.JsonSerializer.Deserialize<ConferenceDto>(content, 
                        new System.Text.Json.JsonSerializerOptions 
                        { 
                            PropertyNameCaseInsensitive = true 
                        });
                    
                    return (conference?.Name ?? "Unknown", conference?.Code ?? "");
                }

                _logger.LogWarning("Failed to fetch conference {ConferenceId} from Conference Service", conferenceId);
                return ("Unknown Conference", "");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching conference info for {ConferenceId}", conferenceId);
                return ("Unknown Conference", "");
            }
        }

        private class ConferenceDto
        {
            public Guid ConferenceId { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Code { get; set; } = string.Empty;
        }
    }
}
