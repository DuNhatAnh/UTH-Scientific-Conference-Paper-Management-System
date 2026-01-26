using Identity.Service.Entities;

namespace Identity.Service.Interfaces.Repositories;

public interface IUserActivityLogRepository
{
    Task AddAsync(UserActivityLog log);
    Task<List<UserActivityLog>> GetByUserIdAsync(Guid userId);
}
