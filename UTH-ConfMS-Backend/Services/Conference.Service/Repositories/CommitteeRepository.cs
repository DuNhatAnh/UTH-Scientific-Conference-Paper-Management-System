using Conference.Service.Data;
using Conference.Service.Entities;
using Conference.Service.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Conference.Service.Repositories;

public class CommitteeRepository : ICommitteeRepository
{
    private readonly ConferenceDbContext _context;

    public CommitteeRepository(ConferenceDbContext context)
    {
        _context = context;
    }

    public async Task<List<CommitteeMember>> GetByConferenceIdAsync(Guid conferenceId)
    {
        return await _context.CommitteeMembers
            .Where(m => m.ConferenceId == conferenceId)
            .ToListAsync();
    }

    public async Task<CommitteeMember?> GetByIdAsync(Guid memberId)
    {
        return await _context.CommitteeMembers.FindAsync(memberId);
    }

    public async Task<CommitteeMember?> GetByConferenceAndUserAsync(Guid conferenceId, Guid userId)
    {
        return await _context.CommitteeMembers
            .FirstOrDefaultAsync(m => m.ConferenceId == conferenceId && m.UserId == userId);
    }

    public async Task CreateAsync(CommitteeMember member)
    {
        await _context.CommitteeMembers.AddAsync(member);
    }

    public async Task DeleteAsync(CommitteeMember member)
    {
        _context.CommitteeMembers.Remove(member);
        await Task.CompletedTask;
    }
}
