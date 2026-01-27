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

    public async Task<List<ReviewerInvitationDto>> GetInvitationsForUserAsync(string userId)
    {
        var result = new List<ReviewerInvitationDto>();
        try
        {
            // 1. Call Identity Service to get user info (email)
            string? email = await GetUserEmailAsync(userId);
            
            var client = _httpClientFactory.CreateClient();
            var conferenceUrl = _configuration["Services:ConferenceServiceUrl"] ?? _configuration["ServiceUrls:Conference"] ?? "http://localhost:5002";

            // Propagate bearer token from current request if present
            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
            }

            // 2. Fetch invitations from DB
            List<ReviewerInvitation> invitations = new List<ReviewerInvitation>();
            if (!string.IsNullOrEmpty(email))
            {
                invitations = await _context.ReviewerInvitations.Where(i => i.Email == email).ToListAsync();
            }

            // 3. Enrich with Conference Name
            foreach (var inv in invitations)
            {
                var dto = new ReviewerInvitationDto
                {
                    Id = inv.Id,
                    ConferenceId = inv.ConferenceId,
                    ConferenceName = inv.ConferenceId, // Default to ID if fetch fails
                    Email = inv.Email,
                    FullName = inv.FullName,
                    Status = inv.Status,
                    Token = inv.Token,
                    SentAt = inv.SentAt,
                    RespondedAt = inv.RespondedAt
                };

                // Call Conference Service to get name
                try 
                {
                    var confResp = await client.GetAsync($"{conferenceUrl}/api/conferences/{inv.ConferenceId}");
                    if (confResp.IsSuccessStatusCode)
                    {
                        var confContent = await confResp.Content.ReadAsStringAsync();
                        using var confDoc = JsonDocument.Parse(confContent);
                        // Access params: data -> name? Or direct?
                        // Assuming ApiResponse<ConferenceDto>
                        if (confDoc.RootElement.TryGetProperty("data", out var confData) && confData.ValueKind == JsonValueKind.Object)
                        {
                            if (confData.TryGetProperty("name", out var confName))
                            {
                                dto.ConferenceName = confName.GetString();
                            }
                        }
                        // Fallback: check root properties just in case
                        else if (confDoc.RootElement.TryGetProperty("name", out var confNameRoot))
                        {
                            dto.ConferenceName = confNameRoot.GetString();
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch name for conference {ConfId}", inv.ConferenceId);
                }

                result.Add(dto);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching invitations for user {UserId}", userId);
        }

        return result;
    }

    public async Task<List<ReviewableSubmissionDto>> GetReviewableSubmissionsAsync(string userId, string conferenceId)
    {
        // 1. Verify Reviewer exists (which implies Invitation Accepted)
        var isReviewer = await _context.Reviewers
            .AnyAsync(r => r.UserId == userId && r.ConferenceId == conferenceId);

        if (!isReviewer)
        {
            return new List<ReviewableSubmissionDto>();
        }

        // 2. Fetch Submissions from Submission Service
        var result = new List<ReviewableSubmissionDto>();
        try
        {
            var client = _httpClientFactory.CreateClient();
            var submissionUrl = _configuration["Services:SubmissionServiceUrl"] ?? _configuration["ServiceUrls:Submission"] ?? "http://localhost:5003";

            // Add Authorization Header for reading all submissions (assuming Submission Service allows Reviewer to read list)
            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
            }

            // Call API with large pageSize to get all
            var response = await client.GetAsync($"{submissionUrl}/api/submissions?conferenceId={conferenceId}&pageSize=1000");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                
                JsonElement data = root;
                // Unwrap ApiResponse logic
                if (root.TryGetProperty("data", out var dataProp) && dataProp.ValueKind == JsonValueKind.Object)
                {
                    data = dataProp;
                }

                // Unwrap PagedResponse logic: items are in "items" array
                if (data.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
                {
                    // Pre-fetch Reviews for this user and conference to minimize DB calls
                    // Path: PaperReview (Reviews) -> Assignment -> Reviewer
                    var myReviews = await _context.Reviews
                        .Include(r => r.Assignment)
                        .ThenInclude(a => a.Reviewer)
                        .Where(r => r.Assignment.Reviewer.UserId == userId && r.Assignment.Reviewer.ConferenceId == conferenceId)
                        .ToListAsync();

                    foreach (var item in items.EnumerateArray())
                    {
                        var dto = new ReviewableSubmissionDto();
                        if (item.TryGetProperty("id", out var id)) dto.Id = id.GetGuid();
                        if (item.TryGetProperty("paperNumber", out var num)) dto.PaperNumber = num.GetInt32();
                        if (item.TryGetProperty("title", out var title)) dto.Title = title.GetString();
                        if (item.TryGetProperty("abstract", out var abs)) dto.Abstract = abs.GetString();
                        if (item.TryGetProperty("submittedAt", out var subAt)) dto.SubmittedAt = subAt.GetString();
                        if (item.TryGetProperty("trackName", out var tn)) dto.TrackName = tn.GetString();
                        if (item.TryGetProperty("fileName", out var fn)) dto.FileName = fn.GetString();

                        // Authors
                        if (item.TryGetProperty("authors", out var auths) && auths.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var a in auths.EnumerateArray())
                            {
                                if (a.TryGetProperty("fullName", out var fnAuth)) dto.Authors.Add(fnAuth.GetString());
                            }
                        }
                        
                        // --- Populate Review Status ---
                        // Match on SubmissionId (stored as PaperId string in Assignment)
                        // PaperReview doesn't have Status property directly, but existence implies "Submitted"? 
                        // Wait, PaperReview model has No "Status". Assignment has "Status".
                        // Check logic: If Assignment.Status == Completed/Accepted ?
                        // Or if PaperReview exists, is it done?
                        // PaperReview has valid Scores/Comments.
                        // Let's assume if a PaperReview record exists, it is at least a Draft or Submitted.
                        // Check Assignment Status for "Completed".
                        
                        var reviewMatch = myReviews.FirstOrDefault(r => r.Assignment.PaperId == dto.Id.ToString());

                        if (reviewMatch != null)
                        {
                            dto.ReviewId = reviewMatch.Id;
                            dto.AssignmentId = reviewMatch.AssignmentId;
                            
                            // If Assignment Status is Completed, then "Submitted"
                            // If Assignment Status is Accepted but Review exists, maybe "Draft"?
                            // Review Service usually uses Assignment Status.
                            dto.ReviewStatus = reviewMatch.Assignment.Status == "Completed" ? "Submitted" : "Draft";
                        }
                        else
                        {
                            // Check if there is an assignment even if no review yet?
                            // We are only looking at "myReviews" which are entries in Reviews table.
                            // If we want to show "Assigned" status even if no review record created yet?
                            // But usually Review record is created when starting review.
                            // For this specific Requirement "Reviewed/Not Reviewed":
                            // If match found -> "Reviewed" (or Draft). If not -> "Not Reviewed".
                            dto.ReviewStatus = reviewMatch != null ? "Submitted" : "None"; 
                            // Update: Use robust status from assignment if possible, but we queried Reviews table.
                            // If we want precise "Draft" vs "Submitted", we need to check fields or Assignment status.
                            // For simplicity based on user request "Reviewed / Not Reviewed":
                            if (reviewMatch != null)
                            {
                                // Refine: if Recommendation is present, it's likely submitted/drafted
                                if (!string.IsNullOrEmpty(reviewMatch.Recommendation))
                                {
                                     dto.ReviewStatus = "Submitted";
                                }
                                else
                                {
                                     dto.ReviewStatus = "Draft";
                                }
                            }
                        }

                        result.Add(dto);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching submissions for reviewer");
        }

        return result;
    }
    public async Task<bool> DeleteInvitationAsync(int invitationId, string userId)
    {
        var invitation = await _context.ReviewerInvitations.FindAsync(invitationId);
        if (invitation == null)
        {
            return false; // Not found
        }

        // Verify ownership
        var email = await GetUserEmailAsync(userId);
        if (string.IsNullOrEmpty(email) || !string.Equals(email, invitation.Email, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("You are not authorized to delete this invitation.");
        }

        _context.ReviewerInvitations.Remove(invitation);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<string?> GetUserEmailAsync(string userId)
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

            var response = await client.GetAsync($"{identityUrl}/api/users/{userId}");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch user from Identity Service for {UserId}. Status: {Status}", userId, response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            if (doc.RootElement.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
            {
                 if (data.TryGetProperty("email", out var emailProp))
                 {
                     return emailProp.GetString();
                 }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user email for {UserId}", userId);
        }
        return null;
    }
}