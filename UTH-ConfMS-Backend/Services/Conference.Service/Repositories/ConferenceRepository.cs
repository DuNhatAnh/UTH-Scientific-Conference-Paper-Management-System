using Conference.Service.Data;
using Conference.Service.Entities;
using Conference.Service.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using ConferenceEntity = Conference.Service.Entities.Conference;

namespace Conference.Service.Repositories;

/// <summary>
/// Repository implementation for Conference entity operations
/// </summary>
public class ConferenceRepository : IConferenceRepository
{
    private readonly ConferenceDbContext _context;

    public ConferenceRepository(ConferenceDbContext context)
    {
        _context = context;
    }

    public async Task<ConferenceEntity?> GetByIdAsync(Guid conferenceId)
    {
        return await _context.Conferences.FindAsync(conferenceId);
    }

    public async Task<ConferenceEntity?> GetByIdWithDetailsAsync(Guid conferenceId)
    {
        return await _context.Conferences
            .Include(c => c.Tracks)
            .Include(c => c.Deadlines)
            .Include(c => c.Topics)
            .FirstOrDefaultAsync(c => c.ConferenceId == conferenceId);
    }

    public async Task<ConferenceEntity?> GetByAcronymAsync(string acronym)
    {
        return await _context.Conferences
            .FirstOrDefaultAsync(c => c.Acronym == acronym);
    }

    public async Task<List<ConferenceEntity>> GetAllAsync(string? status, int skip, int take)
    {
        var query = _context.Conferences.AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<int> CountAsync(string? status)
    {
        var query = _context.Conferences.AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        return await query.CountAsync();
    }

    public async Task<ConferenceEntity> CreateAsync(ConferenceEntity conference)
    {
        await _context.Conferences.AddAsync(conference);
        return conference;
    }

    public Task UpdateAsync(ConferenceEntity conference)
    {
        _context.Conferences.Update(conference);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ConferenceEntity conference)
    {
        _context.Conferences.Remove(conference);
        return Task.CompletedTask;
    }
}
