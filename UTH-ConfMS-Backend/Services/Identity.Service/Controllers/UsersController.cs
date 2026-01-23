using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Identity.Service.DTOs.Common;
using Identity.Service.DTOs.Requests;
using Identity.Service.DTOs.Responses;
using Identity.Service.Interfaces.Services;

namespace Identity.Service.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Nhận hồ sơ người dùng hiện tại
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userService.GetUserByIdAsync(Guid.Parse(userId!));
            return Ok(new ApiResponse<UserDto>
            {
                Success = true,
                Data = user
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get current user failed");
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "User not found"
            });
        }
    }

    /// <summary>
    /// lấy thông tin người dùng theo ID
    /// </summary>
    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetUser(Guid userId)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(userId);
            return Ok(new ApiResponse<UserDto>
            {
                Success = true,
                Data = user
            });
        }
        catch (Exception ex)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "User not found"
            });
        }
    }

    /// <summary>
    /// cập nhật thông tin người dùng
    /// </summary>
    [HttpPut("{userId:guid}")]
    public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] UpdateUserRequest request)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Cho phép nếu là chính chủ HOẶC là Admin (kiểm tra claim role)
            var isAdmin = User.HasClaim(c => c.Type == ClaimTypes.Role && (c.Value == "Administrator" || c.Value == "Admin" || c.Value == "SYSTEM_ADMIN"));
            if (userId.ToString() != currentUserId && !isAdmin)
            {
                return Forbid();
            }

            var user = await _userService.UpdateUserAsync(userId, request);
            return Ok(new ApiResponse<UserDto>
            {
                Success = true,
                Message = "User updated successfully",
                Data = user
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Update user failed for {UserId}", userId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get all users
    /// </summary>
    [HttpGet("allusers")]
    public async Task<IActionResult> GetAllUsers([FromQuery] string? query, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _userService.SearchUsersAsync(query ?? string.Empty, page, pageSize);
            return Ok(new ApiResponse<PagedResponse<UserDto>>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get users failed");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Search users
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string query, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _userService.SearchUsersAsync(query, page, pageSize);
            return Ok(new ApiResponse<PagedResponse<UserDto>>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Search users failed");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Get user roles
    /// </summary>
    [HttpGet("{userId:guid}/roles")]
    public async Task<IActionResult> GetUserRoles(Guid userId, [FromQuery] Guid? conferenceId = null)
    {
        try
        {
            var roles = await _userService.GetUserRolesAsync(userId, conferenceId);
            return Ok(new ApiResponse<List<RoleDto>>
            {
                Success = true,
                Data = roles
            });
        }
        catch (Exception ex)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "User not found"
            });
        }
    }

    /// <summary>
    /// Assign role to user
    /// </summary>
    [HttpPost("{userId:guid}/roles")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<IActionResult> AssignRole(Guid userId, [FromBody] AssignRoleRequest request)
    {
        try
        {
            await _userService.AssignRoleAsync(userId, request);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Role assigned successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Assign role failed");
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
    /// <summary>
    /// Remove role from user
    /// </summary>
    [HttpPost("{userId:guid}/roles/remove")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<IActionResult> RemoveRole(Guid userId, [FromBody] AssignRoleRequest request)
    {
        try
        {
            await _userService.RemoveRoleAsync(userId, request);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Role removed successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Remove role failed");
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Set/Replace user role (Atomic replace)
    /// </summary>
    [HttpPut("{userId:guid}/roles")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<IActionResult> SetUserRole(Guid userId, [FromBody] AssignRoleRequest request)
    {
        try
        {
            await _userService.SetUserRoleAsync(userId, request);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "User role updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Set user role failed");
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Xóa người dùng (Soft delete)
    /// </summary>
    [HttpDelete("{userId:guid}")]
    [Authorize(Policy = "RequireAdminRole")] // Nhớ check quyền Admin
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        try
        {
            await _userService.DeleteUserAsync(userId);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "User deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Delete user failed");

            // Nếu lỗi là do không tìm thấy user, trả về 404 thay vì 400
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }

            // Trả về lỗi chi tiết từ Database (InnerException) để dễ debug
            var errorMessage = ex.InnerException?.Message ?? ex.Message;
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = errorMessage
            });
        }
    }
}