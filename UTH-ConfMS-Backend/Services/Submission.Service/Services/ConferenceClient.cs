using System.Text.Json;
using Submission.Service.DTOs.External;
using Submission.Service.DTOs.Common;
using Submission.Service.Interfaces.Services;

namespace Submission.Service.Services;

public class ConferenceClient : IConferenceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ConferenceClient> _logger;

    public ConferenceClient(HttpClient httpClient, ILogger<ConferenceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ConferenceDto> GetConferenceByIdAsync(Guid id)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/conferences/{id}");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<ConferenceDto>>(content, options);

            if (apiResponse != null && apiResponse.Success && apiResponse.Data != null)
            {
                return apiResponse.Data;
            }

            if (apiResponse != null && !apiResponse.Success)
            {
                 throw new InvalidOperationException($"Conference service returned error: {apiResponse.Message}");
            }
            
            throw new InvalidOperationException($"Failed to deserialize conference data for ID {id}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting conference {Id}", id);
            throw;
        }
    }
}
