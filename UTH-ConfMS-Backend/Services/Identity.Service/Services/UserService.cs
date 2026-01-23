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
            Roles = roles,
            CreatedAt = user.CreatedAt // Map CreatedAt
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
            CreatedAt = u.CreatedAt, // Map CreatedAt
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

    public async Task RemoveRoleAsync(Guid userId, AssignRoleRequest request)
    {
        // Check if user exists
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        // --- GLOBAL REMOVE STRATEGY ---
        // Instead of finding a specific assignment by (ConferenceId, TrackId),
        // we find ALL assignments of this RoleId for this UserId and disable them.
        // This ensures that when Admin says "Remove Chair", it removes Chair from ALL conferences if any.
        
        // Use a direct query because IRepository might not have "GetAllByUserIdAndRoleId".
        // Accessing _unitOfWork.Roles.GetUserRolesAsync returns LIST of UserRole.
        // We can reuse that or add a new method. But GetUserRolesAsync(userId, null) returns filtering by ConferenceId if passed.
        // Let's rely on finding all assignments loop.
        
        // However, IRepository doesn't expose IQueryable. 
        // We can use GetUserRolesAsync(userId, null) -> returns list of roles with null or specific conference?
        // Let's look at RoleRepository: GetUserRolesAsync(userId, null) -> returns where ConferenceId == null OR matching null param?
        // Actually RoleRepository.GetUserRolesAsync(userId, null) returns ALL user roles (checked logic: query = query.Where... only if conferenceId.HasValue).
        // Since we pass null, it skips the filter? No.
        // wait: 
        // if (conferenceId.HasValue) { query = query.Where(ur => ur.ConferenceId == conferenceId.Value || ur.ConferenceId == null); }
        // So if conferenceId is null, it DOES NOT FILTER by ConferenceId. So it returns ALL roles.
        
        var allUserRoles = await _unitOfWork.Roles.GetUserRolesAsync(userId, null);
        
        // Find assignments matching the requested RoleId
        var assignmentsToRemove = allUserRoles.Where(ur => ur.RoleId == request.RoleId).ToList();

        if (assignmentsToRemove.Any())
        {
            foreach (var assignment in assignmentsToRemove)
            {
                assignment.IsActive = false;
                // Update via repo
                await _unitOfWork.Roles.UpdateUserRoleAsync(assignment);
                _logger.LogInformation("Role {RoleId} removed from user {UserId} (Scope: Conf={C}, Track={T})", 
                    request.RoleId, userId, assignment.ConferenceId, assignment.TrackId);
            }
            await _unitOfWork.SaveChangesAsync();
        }
        else
        {
             _logger.LogWarning("Role assignment not found for removal: User {UserId}, Role {RoleId}", userId, request.RoleId);
        }
    }

    public async Task SetUserRoleAsync(Guid userId, AssignRoleRequest request)
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

        // 1. Get ALL existing active roles for this user
        var allUserRoles = await _unitOfWork.Roles.GetUserRolesAsync(userId, null);
        var activeRoles = allUserRoles.Where(ur => ur.IsActive).ToList();

        // 2. Soft delete ALL existing active roles
        foreach (var existingRole in activeRoles)
        {
            existingRole.IsActive = false;
            // UserRole entity does not have UpdatedAt
            await _unitOfWork.Roles.UpdateUserRoleAsync(existingRole);
            _logger.LogInformation("Role {RoleId} removed (deactivated) for user {UserId} as part of SetUserRole", existingRole.RoleId, userId);
        }

        // 3. Assign the new role
        // Check if assignment already exists (even if inactive, to reactive it)
        var targetAssignment = allUserRoles.FirstOrDefault(ur => 
            ur.RoleId == request.RoleId && 
            ur.ConferenceId == request.ConferenceId && 
            ur.TrackId == request.TrackId);

        if (targetAssignment != null)
        {
            // Update existing assignment to Active
            targetAssignment.IsActive = true;
            targetAssignment.ExpiresAt = request.ExpiresAt;
            // targetAssignment.UpdatedAt = DateTime.UtcNow; // UserRole does not have UpdatedAt
            await _unitOfWork.Roles.UpdateUserRoleAsync(targetAssignment);
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
        _logger.LogInformation("SetUserRole: User {UserId} is now assigned ONLY to Role {RoleName}", userId, role.RoleName);
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
    public async Task DeleteUserAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }
        // Soft delete: Chỉ tắt trạng thái hoạt động
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        // EF Core đã tracking entity từ GetByIdAsync, không cần gọi UpdateAsync (tránh lỗi attach/state)
        // await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();
        _logger.LogInformation("User {UserId} deleted (soft delete)", userId);
    }
}