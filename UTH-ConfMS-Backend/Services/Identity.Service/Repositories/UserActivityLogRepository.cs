using Identity.Service.Data;
using Identity.Service.Entities;
using Identity.Service.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Identity.Service.Repositories;

public class UserActivityLogRepository : IUserActivityLogRepository
{
    private readonly IdentityDbContext _context;

    public UserActivityLogRepository(IdentityDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(UserActivityLog log)
    {
        await _context.UserActivityLogs.AddAsync(log);
    }

    public async Task<List<UserActivityLog>> GetByUserIdAsync(Guid userId)
    {
        return await _context.UserActivityLogs
            .Where(l => l.ActorId == userId || l.EntityId == userId.ToString()) // Get logs where user is actor OR target? Maybe just actor? Let's assume broad search for now.
            .OrderByDescending(l => l.Timestamp)
            .Take(100) // Limit
            .ToListAsync();
    }
}
