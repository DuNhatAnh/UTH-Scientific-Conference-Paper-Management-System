using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Review.Service.Interfaces;

namespace Review.Service.Services
{
    public class SubmissionClient : ISubmissionClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SubmissionClient> _logger;

        public SubmissionClient(HttpClient httpClient, IConfiguration configuration, ILogger<SubmissionClient> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task UpdateSubmissionStatusAsync(string paperId, string status)
        {
            try
            {
                var submissionServiceUrl = _configuration["Services:SubmissionServiceUrl"] ?? _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";
                
                var payload = new { Status = status };
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                _logger.LogInformation($"[SubmissionClient] Calling {submissionServiceUrl}/api/Submissions/{paperId}/status with status {status}");
                
                var response = await _httpClient.PutAsync($"{submissionServiceUrl}/api/Submissions/{paperId}/status", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to update submission status in Submission Service. Status: {response.StatusCode}, Body: {errorBody}");
                }
                else
                {
                    _logger.LogInformation($"Successfully updated submission {paperId} status to {status} in Submission Service.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error communicating with Submission Service for paper {paperId}");
            }
        }
    }
}
