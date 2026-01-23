using Conference.Service.Entities;

namespace Conference.Service.Interfaces.Repositories;

public interface ICommitteeRepository
{
    Task<List<CommitteeMember>> GetByConferenceIdAsync(Guid conferenceId);
    Task<CommitteeMember?> GetByIdAsync(Guid memberId);
    Task<CommitteeMember?> GetByConferenceAndUserAsync(Guid conferenceId, Guid userId);
    Task CreateAsync(CommitteeMember member);
    Task DeleteAsync(CommitteeMember member);
}
