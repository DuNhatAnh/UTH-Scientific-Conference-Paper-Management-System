using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Identity.Service.DTOs.Common;
using Identity.Service.DTOs.Requests;
using Identity.Service.DTOs.Responses;
using Identity.Service.Interfaces.Services;

namespace Identity.Service.Controllers;

/// <summary>
/// Controller for managing roles and permissions
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireAdminRole")]
public class RolesController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<RolesController> _logger;

    public RolesController(IUserService userService, ILogger<RolesController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get all roles
    /// </summary>
    [HttpGet("allroles")]
    public async Task<IActionResult> GetRoles()
    {
        try
        {
            var roles = await _userService.GetAllRolesAsync();
            return Ok(new ApiResponse<List<RoleDto>>
            {
                Success = true,
                Data = roles
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get roles failed");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error"
            });
        }
    }

    /// <summary>
    /// Get role by ID
    /// </summary>
    [HttpGet("{roleId:guid}")]
    public async Task<IActionResult> GetRole(Guid roleId)
    {
        try
        {
            var role = await _userService.GetRoleByIdAsync(roleId);
            return Ok(new ApiResponse<RoleDto>
            {
                Success = true,
                Data = role
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get role failed for {RoleId}", roleId);
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Role not found"
            });
        }
    }

    /// <summary>
    /// Create a new role
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
    {
        try
        {
            var role = await _userService.CreateRoleAsync(request);
            return Ok(new ApiResponse<RoleDto>
            {
                Success = true,
                Message = "Role created successfully",
                Data = role
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Create role failed");
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Update role
    /// </summary>
    [HttpPut("{roleId:guid}")]
    public async Task<IActionResult> UpdateRole(Guid roleId, [FromBody] UpdateRoleRequest request)
    {
        try
        {
            var role = await _userService.UpdateRoleAsync(roleId, request);
            return Ok(new ApiResponse<RoleDto>
            {
                Success = true,
                Message = "Role updated successfully",
                Data = role
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Update role failed for {RoleId}", roleId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Delete role
    /// </summary>
    [HttpDelete("{roleId:guid}")]
    public async Task<IActionResult> DeleteRole(Guid roleId)
    {
        try
        {
            await _userService.DeleteRoleAsync(roleId);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Role deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Delete role failed for {RoleId}", roleId);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
}
