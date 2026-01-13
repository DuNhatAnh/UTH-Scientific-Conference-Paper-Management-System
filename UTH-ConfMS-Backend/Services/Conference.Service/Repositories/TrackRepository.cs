using Conference.Service.Data;
using Conference.Service.Entities;
using Conference.Service.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Conference.Service.Repositories;

/// <summary>
/// Repository implementation for ConferenceTrack entity operations
/// </summary>
public class TrackRepository : ITrackRepository
{
    private readonly ConferenceDbContext _context;

    public TrackRepository(ConferenceDbContext context)
    {
        _context = context;
    }

    public async Task<ConferenceTrack?> GetByIdAsync(Guid trackId)
    {
        return await _context.ConferenceTracks.FindAsync(trackId);
    }

    public async Task<List<ConferenceTrack>> GetByConferenceIdAsync(Guid conferenceId)
    {
        return await _context.ConferenceTracks
            .Where(t => t.ConferenceId == conferenceId)
            .OrderBy(t => t.Name)
            .ToListAsync();
    }

    public async Task<ConferenceTrack> CreateAsync(ConferenceTrack track)
    {
        await _context.ConferenceTracks.AddAsync(track);
        return track;
    }

    public Task UpdateAsync(ConferenceTrack track)
    {
        _context.ConferenceTracks.Update(track);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(ConferenceTrack track)
    {
        _context.ConferenceTracks.Remove(track);
        return Task.CompletedTask;
    }
}
