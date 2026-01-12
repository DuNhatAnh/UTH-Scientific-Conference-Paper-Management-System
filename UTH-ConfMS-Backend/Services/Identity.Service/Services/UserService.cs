using Identity.Service.DTOs.Common;
using Identity.Service.DTOs.Requests;
using Identity.Service.DTOs.Responses;
using Identity.Service.Entities;
using Identity.Service.Interfaces;
using Identity.Service.Interfaces.Services;

namespace Identity.Service.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UserService> _logger;

    public UserService(IUnitOfWork unitOfWork, ILogger<UserService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<UserDto> GetUserByIdAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdWithRolesAsync(userId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        var roles = user.UserRoles
            .Where(ur => ur.IsActive && (!ur.ExpiresAt.HasValue || ur.ExpiresAt.Value > DateTime.UtcNow))
            .Select(ur => ur.Role.RoleName)
            .ToList();

        return new UserDto
        {
            Id = user.UserId,
            Email = user.Email,
            Username = user.Username,
            FullName = user.FullName,
            Affiliation = user.Affiliation,
            Roles = roles
        };
    }

    public async Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        // Update fields if provided
        if (request.FullName != null) user.FullName = request.FullName;
        if (request.Affiliation != null) user.Affiliation = request.Affiliation;
        if (request.Department != null) user.Department = request.Department;
        if (request.Title != null) user.Title = request.Title;
        if (request.Country != null) user.Country = request.Country;
        if (request.Phone != null) user.Phone = request.Phone;
        if (request.Orcid != null) user.Orcid = request.Orcid;
        if (request.GoogleScholarId != null) user.GoogleScholarId = request.GoogleScholarId;
        if (request.Bio != null) user.Bio = request.Bio;

        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        return await GetUserByIdAsync(userId);
    }

    public async Task<PagedResponse<UserDto>> SearchUsersAsync(string query, int page, int pageSize)
    {
        var totalCount = await _unitOfWork.Users.CountSearchUsersAsync(query);
        var users = await _unitOfWork.Users.SearchUsersAsync(query, (page - 1) * pageSize, pageSize);

        var userDtos = users.Select(u => new UserDto
        {
            Id = u.UserId,
            Email = u.Email,
            Username = u.Username,
            FullName = u.FullName,
            Affiliation = u.Affiliation,
            Roles = u.UserRoles
                .Where(ur => ur.IsActive)
                .Select(ur => ur.Role.RoleName)
                .ToList()
        }).ToList();

        return new PagedResponse<UserDto>
        {
            Items = userDtos,
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<List<RoleDto>> GetUserRolesAsync(Guid userId, Guid? conferenceId)
    {
        var userRoles = await _unitOfWork.Roles.GetUserRolesAsync(userId, conferenceId);

        return userRoles.Select(ur => new RoleDto
        {
            Id = ur.Role.RoleId,
            Name = ur.Role.RoleName,
            DisplayName = ur.Role.DisplayName,
            ConferenceId = ur.ConferenceId,
            TrackId = ur.TrackId,
            IsActive = ur.IsActive && (!ur.ExpiresAt.HasValue || ur.ExpiresAt.Value > DateTime.UtcNow),
            ExpiresAt = ur.ExpiresAt
        }).ToList();
    }

    public async Task AssignRoleAsync(Guid userId, AssignRoleRequest request)
    {
        // Check if user exists
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        // Check if role exists
        var role = await _unitOfWork.Roles.GetByIdAsync(request.RoleId);
        if (role == null)
        {
            throw new InvalidOperationException("Role not found");
        }

        // Check if assignment already exists
        var existingAssignment = await _unitOfWork.Roles.GetUserRoleAsync(
            userId, request.RoleId, request.ConferenceId, request.TrackId);

        if (existingAssignment != null)
        {
            // Update existing assignment
            existingAssignment.IsActive = true;
            existingAssignment.ExpiresAt = request.ExpiresAt;
            await _unitOfWork.Roles.UpdateUserRoleAsync(existingAssignment);
        }
        else
        {
            // Create new assignment
            var userRole = new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = userId,
                RoleId = request.RoleId,
                ConferenceId = request.ConferenceId,
                TrackId = request.TrackId,
                ExpiresAt = request.ExpiresAt,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            };

            await _unitOfWork.Roles.CreateUserRoleAsync(userRole);
        }

        await _unitOfWork.SaveChangesAsync();
        _logger.LogInformation("Role {RoleName} assigned to user {UserId}", role.RoleName, userId);
    }

    public async Task<List<RoleDto>> GetAllRolesAsync()
    {
        var roles = await _unitOfWork.Roles.GetAllAsync();
        return roles.Select(r => new RoleDto
        {
            Id = r.RoleId,
            Name = r.RoleName,
            DisplayName = r.DisplayName,
            IsActive = r.IsActive
        }).ToList();
    }

    public async Task<RoleDto> GetRoleByIdAsync(Guid roleId)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
        if (role == null)
        {
            throw new InvalidOperationException("Role not found");
        }

        return new RoleDto
        {
            Id = role.RoleId,
            Name = role.RoleName,
            DisplayName = role.DisplayName,
            IsActive = role.IsActive
        };
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request)
    {
        var role = new Role
        {
            RoleId = Guid.NewGuid(),
            RoleName = request.Name,
            DisplayName = request.Name,
            Description = request.Description,
            IsSystemRole = request.IsSystemRole,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Roles.AddAsync(role);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Role {RoleName} created", role.RoleName);

        return new RoleDto
        {
            Id = role.RoleId,
            Name = role.RoleName,
            DisplayName = role.DisplayName,
            IsActive = role.IsActive
        };
    }

    public async Task<RoleDto> UpdateRoleAsync(Guid roleId, UpdateRoleRequest request)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
        if (role == null)
        {
            throw new InvalidOperationException("Role not found");
        }

        if (role.IsSystemRole)
        {
            throw new InvalidOperationException("Cannot update system role");
        }

        if (request.Name != null)
        {
            role.RoleName = request.Name;
            role.DisplayName = request.Name;
        }
        if (request.Description != null)
        {
            role.Description = request.Description;
        }

        role.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Role {RoleId} updated", roleId);

        return new RoleDto
        {
            Id = role.RoleId,
            Name = role.RoleName,
            DisplayName = role.DisplayName,
            IsActive = role.IsActive
        };
    }

    public async Task DeleteRoleAsync(Guid roleId)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
        if (role == null)
        {
            throw new InvalidOperationException("Role not found");
        }

        if (role.IsSystemRole)
        {
            throw new InvalidOperationException("Cannot delete system role");
        }

        role.IsActive = false;
        role.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Role {RoleId} deleted (soft delete)", roleId);
    }
}
