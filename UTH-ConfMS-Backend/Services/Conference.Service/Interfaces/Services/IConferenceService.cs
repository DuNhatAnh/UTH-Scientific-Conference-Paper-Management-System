using Conference.Service.DTOs.Common;
using Conference.Service.DTOs.Requests;
using Conference.Service.DTOs.Responses;

namespace Conference.Service.Interfaces.Services;

public interface IConferenceService
{
    Task<PagedResponse<ConferenceDto>> GetConferencesAsync(string? status, int page, int pageSize);
    Task<ConferenceDetailDto> GetConferenceByIdAsync(Guid conferenceId);
    Task<ConferenceDto> CreateConferenceAsync(CreateConferenceRequest request, Guid createdBy);
    Task<ConferenceDto> UpdateConferenceAsync(Guid conferenceId, UpdateConferenceRequest request, Guid userId);
    Task DeleteConferenceAsync(Guid conferenceId, Guid userId);
    Task<CallForPapersDto> GetCallForPapersAsync(Guid conferenceId);
    Task<CallForPapersDto> UpdateCallForPapersAsync(Guid conferenceId, UpdateCallForPapersRequest request, Guid userId);
    Task<List<TrackDto>> GetTracksAsync(Guid conferenceId);
    Task<TrackDto> AddTrackAsync(Guid conferenceId, CreateTrackRequest request);
    Task<List<DeadlineDto>> GetDeadlinesAsync(Guid conferenceId);
    Task<DeadlineDto> AddDeadlineAsync(Guid conferenceId, CreateDeadlineRequest request);
}
