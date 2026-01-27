using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Review.Service.Data;
using Review.Service.DTOs;
using Review.Service.Entities;
using Review.Service.Interfaces;

namespace Review.Service.Services;

public class ReviewerService : IReviewerService
{
    private readonly ReviewDbContext _context;
    private readonly ILogger<ReviewerService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor _httpContextAccessor;

    public ReviewerService(ReviewDbContext context, ILogger<ReviewerService> logger, IHttpClientFactory httpClientFactory, IConfiguration configuration, Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<ReviewerInvitation> InviteReviewerAsync(InviteReviewerDTO dto)
    {
        // Kiểm tra xem đã mời chưa
        var existing = await _context.ReviewerInvitations
            .FirstOrDefaultAsync(x => x.ConferenceId == dto.ConferenceId && x.Email == dto.Email);

        if (existing != null)
        {
            throw new Exception("Email này đã được gửi lời mời cho hội nghị này.");
        }

        // Kiểm tra xem đã là Reviewer chưa
        var isReviewer = await _context.Reviewers
            .AnyAsync(r => r.ConferenceId == dto.ConferenceId && r.Email == dto.Email);
        
        if (isReviewer)
        {
            throw new Exception("Người dùng này đã là Reviewer của hội nghị.");
        }

        var invitation = new ReviewerInvitation
        {
            ConferenceId = dto.ConferenceId,
            Email = dto.Email,
            FullName = dto.FullName,
            Status = "Pending",
            Token = Guid.NewGuid().ToString(),
            SentAt = DateTime.UtcNow
        };

        _context.ReviewerInvitations.Add(invitation);
        await _context.SaveChangesAsync();

        // Gửi email thông qua Notification Service
        try 
        {
            // Lấy cấu hình từ appsettings.json (hoặc biến môi trường từ docker-compose: Services__NotificationServiceUrl)
            var notificationServiceUrl = _configuration["Services:NotificationServiceUrl"] ?? _configuration["ServiceUrls:Notification"] ?? "http://localhost:5005";
            var frontendUrl = _configuration["Services:FrontendUrl"] ?? _configuration["ServiceUrls:Frontend"] ?? "http://localhost:3000";

            var client = _httpClientFactory.CreateClient();
            var emailPayload = new 
            {
                ToEmail = dto.Email,
                Subject = "Invitation to PC Member - UTH ConfMS",
                Body = $"Dear {dto.FullName},<br/>You have been invited to be a reviewer. Click here to accept: <a href='{frontendUrl}/invite/accept?token={invitation.Token}'>Accept Invitation</a>"
            };

            var content = new StringContent(JsonSerializer.Serialize(emailPayload), Encoding.UTF8, "application/json");
            
            // Giả định Notification Service có endpoint này (dựa trên kiến trúc microservices)
            // LƯU Ý: Internal Service name là notification-service (port 5005 trong container)
            var response = await client.PostAsync($"{notificationServiceUrl}/api/notifications/send-email", content);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Failed to send email to {dto.Email}. Status: {response.StatusCode} - Url: {notificationServiceUrl}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error communicating with Notification Service for {dto.Email}");
            // Không throw exception ở đây để tránh rollback transaction mời thành công
        }
        
        return invitation;
    }

    public async Task<bool> RespondToInvitationAsync(InvitationResponseDTO dto, string? userId = null)
    {
        var invitation = await _context.ReviewerInvitations
            .FirstOrDefaultAsync(x => x.Token == dto.Token);

        if (invitation == null || invitation.Status != "Pending")
        {
            throw new Exception("Lời mời không hợp lệ hoặc đã được xử lý.");
        }

        invitation.RespondedAt = DateTime.UtcNow;
        invitation.Status = dto.IsAccepted ? "Accepted" : "Declined";

        if (dto.IsAccepted)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID is required to accept the invitation.");
            }

            // Nếu đã có reviewer được tạo trước (ví dụ Chair đã assign bằng email), cập nhật UserId cho bản ghi đó
            var existingByEmail = await _context.Reviewers
                .FirstOrDefaultAsync(r => r.Email == invitation.Email && r.ConferenceId == invitation.ConferenceId);

            if (existingByEmail != null)
            {
                // Gán UserId nếu chưa có hoặc khác
                if (string.IsNullOrEmpty(existingByEmail.UserId) || existingByEmail.UserId != userId)
                {
                    existingByEmail.UserId = userId;
                    _context.Reviewers.Update(existingByEmail);
                }
            }
            else
            {
                // Nếu không có reviewer theo email, kiểm tra theo UserId
                var alreadyExists = await _context.Reviewers
                    .AnyAsync(r => r.UserId == userId && r.ConferenceId == invitation.ConferenceId);

                if (!alreadyExists)
                {
                    var reviewer = new Reviewer
                    {
                        UserId = userId,
                        ConferenceId = invitation.ConferenceId,
                        Email = invitation.Email,
                        FullName = invitation.FullName,
                        Expertise = "General",
                    };
                    _context.Reviewers.Add(reviewer);
                }
                else
                {
                    _logger.LogWarning($"User {userId} is already a reviewer for conference {invitation.ConferenceId}.");
                }
            }

            // --- Call Identity Service to Grant REVIEWER Role ---
            try
            {
                var identityUrl = _configuration["Services:IdentityServiceUrl"] ?? _configuration["ServiceUrls:Identity"] ?? "http://localhost:5001";
                var internalApiKey = _configuration["InternalApiKey"] ?? "auth-secret-key-123";

                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("X-Internal-Api-Key", internalApiKey);

                var roleRequest = new { RoleName = "REVIEWER" };
                var jsonContent = new StringContent(JsonSerializer.Serialize(roleRequest), Encoding.UTF8, "application/json");

                // Note: User Internal API endpoint
                var roleResponse = await client.PostAsync($"{identityUrl}/api/internal/users/{userId}/roles", jsonContent);

                if (roleResponse.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Successfully granted REVIEWER role to user {userId}");
                }
                else
                {
                    _logger.LogError($"Failed to grant REVIEWER role to user {userId}. Status: {roleResponse.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Identity Service to grant role: " + ex.Message);
                // THROW to debug
                throw new Exception($"Failed to grant role: {ex.Message}"); 
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Reviewer>> GetReviewersByConferenceAsync(string conferenceId)
        => await _context.Reviewers.Where(r => r.ConferenceId == conferenceId).ToListAsync();

    public async Task<List<ReviewerInvitation>> GetInvitationsByConferenceAsync(string conferenceId)
        => await _context.ReviewerInvitations.Where(i => i.ConferenceId == conferenceId).ToListAsync();

    public async Task<List<ReviewerInvitation>> GetInvitationsForUserAsync(string userId)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var identityUrl = _configuration["Services:IdentityServiceUrl"] ?? _configuration["ServiceUrls:Identity"] ?? "http://localhost:5001";

            // Propagate bearer token from current request if present
            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
            }

            // Call Identity Service to get user info (email)
            var response = await client.GetAsync($"{identityUrl}/api/users/{userId}");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch user from Identity Service for {UserId}. Status: {Status}", userId, response.StatusCode);
                return new List<ReviewerInvitation>();
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // Expect ApiResponse<UserDto> shape
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;
            if (root.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
            {
                string? email = null;
                if (data.TryGetProperty("email", out var emailProp))
                {
                    email = emailProp.GetString();
                }

                if (!string.IsNullOrEmpty(email))
                {
                    return await _context.ReviewerInvitations.Where(i => i.Email == email).ToListAsync();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching invitations for user {UserId}", userId);
        }

        return new List<ReviewerInvitation>();
    }
}