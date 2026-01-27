using Submission.Service.DTOs.External;

namespace Submission.Service.Interfaces.Services;

public interface IConferenceClient
{
    Task<ConferenceDto> GetConferenceByIdAsync(Guid id);
}
