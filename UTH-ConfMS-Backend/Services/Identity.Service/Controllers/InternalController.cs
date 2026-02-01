using Microsoft.AspNetCore.Mvc;
using Identity.Service.Interfaces.Services;
using Identity.Service.Interfaces;
using Identity.Service.DTOs.Requests;
using System.Text.Json;

namespace Identity.Service.Controllers;

[ApiController]
[Route("api/internal")]
public class InternalController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly ILogger<InternalController> _logger;

    public InternalController(
        IUserService userService,
        IUnitOfWork unitOfWork,
        IConfiguration configuration, 
        ILogger<InternalController> logger)
    {
        _userService = userService;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("users/{userId:guid}/roles")]
    public async Task<IActionResult> AssignRoleInternal(Guid userId, [FromBody] JsonElement requestBody)
    {
        // Simple API Key check
        var apiKey = Request.Headers["X-Internal-Api-Key"].FirstOrDefault();
        var configuredKey = _configuration["InternalApiKey"] ?? "auth-secret-key-123"; 
        
        if (apiKey != configuredKey)
        {
            _logger.LogWarning("Invalid or missing Internal API Key. Received: {ReceivedKey}", apiKey);
            return Unauthorized(new { message = "Invalid API Key" });
        }

        try
        {
            string roleName = "REVIEWER"; // Default
            if (requestBody.TryGetProperty("RoleName", out var roleNameProp))
            {
                roleName = roleNameProp.GetString() ?? "REVIEWER";
            }

            // Lookup RoleId by RoleName
            var roles = await _userService.GetAllRolesAsync();
            var targetRole = roles.FirstOrDefault(r => r.Name.Equals(roleName, StringComparison.OrdinalIgnoreCase));

            if (targetRole == null)
            {
                return BadRequest(new { message = $"Role '{roleName}' not found." });
            }

            var assignRequest = new AssignRoleRequest
            {
                UserId = userId,
                RoleId = targetRole.Id,
                ConferenceId = null, // Global or check requestBody for specifics
                TrackId = null
            };

            await _userService.AssignRoleAsync(userId, assignRequest);
            _logger.LogInformation("Successfully assigned role {RoleName} ({RoleId}) to user {UserId} via Internal API", roleName, targetRole.Id, userId);
            return Ok(new { message = "Role assigned successfully (Internal)" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Internal AssignRole failed");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("users/by-email/{email}")]
    public async Task<IActionResult> GetUserByEmail(string email)
    {
        // Simple API Key check
        var apiKey = Request.Headers["X-Internal-Api-Key"].FirstOrDefault();
        var configuredKey = _configuration["InternalApiKey"] ?? "auth-secret-key-123"; 
        
        if (apiKey != configuredKey)
        {
            _logger.LogWarning("Invalid or missing Internal API Key. Received: {ReceivedKey}", apiKey);
            return Unauthorized(new { message = "Invalid API Key" });
        }

        try
        {
            var user = await _unitOfWork.Users.GetByEmailAsync(email);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new { userId = user.UserId, email = user.Email, fullName = user.FullName });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Internal GetUserByEmail failed for email {Email}", email);
            return BadRequest(new { message = ex.Message });
        }
    }
}
