using Conference.Service.Data;
using Conference.Service.Entities;
using Conference.Service.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Conference.Service.Repositories;

/// <summary>
/// Repository implementation for ConferenceDeadline entity operations
/// </summary>
public class DeadlineRepository : IDeadlineRepository
{
    private readonly ConferenceDbContext _context;

    public DeadlineRepository(ConferenceDbContext context)
    {
        _context = context;
    }

    public async Task<ConferenceDeadline?> GetByIdAsync(Guid deadlineId)
    {
        return await _context.ConferenceDeadlines.FindAsync(deadlineId);
    }

    public async Task<List<ConferenceDeadline>> GetByConferenceIdAsync(Guid conferenceId)
    {
        return await _context.ConferenceDeadlines
            .Where(d => d.ConferenceId == conferenceId)
            .OrderBy(d => d.DeadlineDate)
            .ToListAsync();
    }

    public async Task<ConferenceDeadline> CreateAsync(ConferenceDeadline deadline)
    {
        await _context.ConferenceDeadlines.AddAsync(deadline);
        return deadline;
    }

    public Task UpdateAsync(ConferenceDeadline deadline)
    {
        _context.ConferenceDeadlines.Update(deadline);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ConferenceDeadline deadline)
    {
        _context.ConferenceDeadlines.Remove(deadline);
        return Task.CompletedTask;
    }
}
