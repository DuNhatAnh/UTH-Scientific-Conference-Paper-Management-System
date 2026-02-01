using Conference.Service.Entities;
using ConferenceEntity = Conference.Service.Entities.Conference;

namespace Conference.Service.Interfaces.Repositories;

/// <summary>
/// Repository interface for Conference entity operations
/// </summary>
public interface IConferenceRepository
{
    Task<ConferenceEntity?> GetByIdAsync(Guid conferenceId);
    Task<ConferenceEntity?> GetByIdWithDetailsAsync(Guid conferenceId);
    Task<ConferenceEntity?> GetByAcronymAsync(string acronym);
    Task<List<ConferenceEntity>> GetAllAsync(string? status, int skip, int take);
    Task<int> CountAsync(string? status);
    Task<ConferenceEntity> CreateAsync(ConferenceEntity conference);
    Task UpdateAsync(ConferenceEntity conference);
    Task DeleteAsync(ConferenceEntity conference);

}
