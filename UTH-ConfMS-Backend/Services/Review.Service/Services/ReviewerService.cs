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
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using MassTransit;
using UTH.ConfMS.Shared.Infrastructure.EventBus;

namespace Review.Service.Services;

public class ReviewerService : IReviewerService
{
    private readonly ReviewDbContext _context;
    private readonly ILogger<ReviewerService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor _httpContextAccessor;
    private readonly IPublishEndpoint _publishEndpoint;

    public ReviewerService(
        ReviewDbContext context, 
        ILogger<ReviewerService> logger, 
        IHttpClientFactory httpClientFactory, 
        IConfiguration configuration, 
        Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor,
        IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _httpContextAccessor = httpContextAccessor;
        _publishEndpoint = publishEndpoint;
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

        // Kiểm tra xem người được mời đã có tài khoản trong hệ thống chưa
        Guid? existingUserId = null;
        try
        {
            var identityServiceUrl = _configuration["Services:IdentityServiceUrl"] ?? _configuration["ServiceUrls:Identity"] ?? "http://localhost:5001";
            var internalApiKey = _configuration["InternalApiKey"] ?? "auth-secret-key-123";
            
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Internal-Api-Key", internalApiKey);
            
            var response = await client.GetAsync($"{identityServiceUrl}/api/internal/users/by-email/{Uri.EscapeDataString(dto.Email)}");
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var userInfo = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(responseContent);
                
                if (userInfo != null && userInfo.ContainsKey("userId"))
                {
                    var userIdString = userInfo["userId"].GetString();
                    if (Guid.TryParse(userIdString, out var parsedUserId))
                    {
                        existingUserId = parsedUserId;
                        _logger.LogInformation($"Found existing user {existingUserId} for email {dto.Email}");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, $"Could not check if user exists for email {dto.Email}");
        }

        // Gửi thông báo trong app nếu user đã có tài khoản
        if (existingUserId.HasValue)
        {
            try
            {
                var frontendUrl = _configuration["Services:FrontendUrl"] ?? _configuration["ServiceUrls:Frontend"] ?? "http://localhost:3000";
                
                await _publishEndpoint.Publish(new CreateNotificationEvent
                {
                    UserId = existingUserId.Value,
                    UserEmail = dto.Email,
                    NotificationType = "REVIEW",
                    Title = "Lời mời tham gia hội đồng phản biện",
                    Message = $"Bạn đã được mời làm reviewer cho hội nghị. Bấm để xem chi tiết và chấp nhận lời mời.",
                    ActionUrl = $"/invitation/{invitation.Token}",
                    SendEmail = true,
                    EmailSubject = "Invitation to PC Member - UTH ConfMS",
                    EmailBody = $"Dear {dto.FullName},<br/>You have been invited to be a reviewer. Click here to accept: <a href='{frontendUrl}/invitation/{invitation.Token}'>Accept Invitation</a>"
                });

                _logger.LogInformation($"Published notification event for user {existingUserId} (email: {dto.Email})");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error publishing notification event for {dto.Email}");
            }
        }
        else
        {
            // Nếu user chưa có tài khoản, chỉ gửi email qua HTTP call (fallback)
            try 
            {
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
                var response = await client.PostAsync($"{notificationServiceUrl}/api/notifications/send-email", content);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Failed to send email to {dto.Email}. Status: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending email to {dto.Email}");
            }
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

            // CHECK 1: See if a reviewer already exists with this UserId + ConferenceId
            var existingByUserId = await _context.Reviewers
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ConferenceId == invitation.ConferenceId);

            if (existingByUserId != null)
            {
                // Already exists, don't need to do anything - just log
                _logger.LogWarning($"User {userId} is already a reviewer for conference {invitation.ConferenceId}.");
            }
            else
            {
                // CHECK 2: See if reviewer exists by email
                var existingByEmail = await _context.Reviewers
                    .FirstOrDefaultAsync(r => r.Email == invitation.Email && r.ConferenceId == invitation.ConferenceId);

                if (existingByEmail != null)
                {
                    // Update existing reviewer with the new UserId
                    string oldUserId = existingByEmail.UserId;
                    existingByEmail.UserId = userId;
                    _context.Reviewers.Update(existingByEmail);

                    // FIX: Migrate Assignments if UserId changed
                    if (!string.IsNullOrEmpty(oldUserId) && oldUserId != "0" && oldUserId != userId && Guid.TryParse(oldUserId, out var oldGuid))
                    {
                        if (Guid.TryParse(userId, out var newGuid))
                        {
                            var orphanAssignments = await _context.Assignments.Where(a => a.ReviewerId == oldGuid).ToListAsync();
                            if (orphanAssignments.Any())
                            {
                                foreach (var assign in orphanAssignments)
                                {
                                    assign.ReviewerId = newGuid;
                                }
                                _context.Assignments.UpdateRange(orphanAssignments);
                                _logger.LogInformation($"Migrated {orphanAssignments.Count} assignments from {oldGuid} to {newGuid}");
                            }
                        }
                    }
                }
                else
                {
                    // CHECK 3: Create new reviewer record
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

    public async Task<ReviewerInvitationDto?> GetInvitationByTokenAsync(string token)
    {
        var invitation = await _context.ReviewerInvitations
            .FirstOrDefaultAsync(x => x.Token == token);

        if (invitation == null)
        {
            return null;
        }

        // Lấy thông tin conference nếu cần
        string conferenceName = "Conference";
        try
        {
            var conferenceServiceUrl = _configuration["Services:ConferenceServiceUrl"] ?? "http://conference-service:5002";
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{conferenceServiceUrl}/api/conferences/{invitation.ConferenceId}");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var conferenceInfo = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(content);
                if (conferenceInfo != null && conferenceInfo.ContainsKey("name"))
                {
                    conferenceName = conferenceInfo["name"].GetString() ?? conferenceName;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not retrieve conference name for {ConferenceId}", invitation.ConferenceId);
        }

        return new ReviewerInvitationDto
        {
            Id = invitation.Id,
            ConferenceId = invitation.ConferenceId,
            ConferenceName = conferenceName,
            Email = invitation.Email,
            FullName = invitation.FullName,
            Status = invitation.Status,
            Token = invitation.Token,
            SentAt = invitation.SentAt,
            RespondedAt = invitation.RespondedAt
        };
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
                        
                        // Access params: data.name, data.Name, or root.name, root.Name
                        JsonElement dataElem = confDoc.RootElement;
                        if (confDoc.RootElement.TryGetProperty("data", out var dataProp) && dataProp.ValueKind == JsonValueKind.Object)
                        {
                            dataElem = dataProp;
                        }

                        // Try various property names for the conference title
                        if (dataElem.TryGetProperty("name", out var confName))
                        {
                            dto.ConferenceName = confName.GetString();
                        }
                        else if (dataElem.TryGetProperty("Name", out var confNameProp))
                        {
                            dto.ConferenceName = confNameProp.GetString();
                        }
                        else if (dataElem.TryGetProperty("acronym", out var acronym))
                        {
                            dto.ConferenceName = acronym.GetString();
                        }
                        else if (dataElem.TryGetProperty("Acronym", out var acronymProp))
                        {
                            dto.ConferenceName = acronymProp.GetString();
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
        // 1. Get user email
        string? userEmail = await GetUserEmailAsync(userId);
        _logger.LogInformation("[GetReviewableSubmissionsAsync] UserId: {UserId}, Email: {Email}, Conf: {ConfId}", userId, userEmail, conferenceId);

        // 2. Verify Reviewer exists (match by UserId OR Email)
        var reviewer = await _context.Reviewers
            .FirstOrDefaultAsync(r => (r.UserId == userId || (!string.IsNullOrEmpty(userEmail) && r.Email == userEmail)) 
                                       && r.ConferenceId == conferenceId);

        if (reviewer == null)
        {
            _logger.LogWarning("[GetReviewableSubmissionsAsync] Reviewer record not found for user {UserId}/{Email} in conference {ConfId}", userId, userEmail, conferenceId);
            return new List<ReviewableSubmissionDto>();
        }

        // _logger.LogInformation("[GetReviewableSubmissionsAsync] Found Reviewer record ID: {Id}, Current UserId in DB: {DBUserId}", reviewer.Id, reviewer.UserId);

        // 2b. Auto-map UserId if it was "0" or missing
        if ((string.IsNullOrEmpty(reviewer.UserId) || reviewer.UserId == "0") && !string.IsNullOrEmpty(userId))
        {
            string oldUserId = reviewer.UserId;
            reviewer.UserId = userId;
            _context.Reviewers.Update(reviewer);
            
            // FIX: Migrate Assignments if UserId changed (Self-healing)
            if (!string.IsNullOrEmpty(oldUserId) && oldUserId != "0" && oldUserId != userId && Guid.TryParse(oldUserId, out var oldGuid))
            {
                 if (Guid.TryParse(userId, out var newGuid))
                 {
                     var orphanAssignments = await _context.Assignments.Where(a => a.ReviewerId == oldGuid).ToListAsync();
                     if (orphanAssignments.Any())
                     {
                         foreach (var assign in orphanAssignments)
                         {
                             assign.ReviewerId = newGuid;
                         }
                         _context.Assignments.UpdateRange(orphanAssignments);
                         _logger.LogInformation($"[Self-Healing] Migrated {orphanAssignments.Count} assignments from {oldGuid} to {newGuid}");
                     }
                 }
            }

            await _context.SaveChangesAsync();
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
            else
            {
                // Fallback to internal API key for service-to-service calls
                var internalApiKey = _configuration["InternalApiKey"] ?? "auth-secret-key-123";
                client.DefaultRequestHeaders.Add("X-Internal-Api-Key", internalApiKey);
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
                    // 1. Lấy danh sách Assignments của Reviewer này cho Conference hiện tại
                    // OPTIMIZED: Filter directly by ReviewerId (Guid) instead of fragile string Join
                    List<Assignment> myAssignments = new List<Assignment>();
                    
                    if (Guid.TryParse(reviewer.UserId, out var reviewerGuid))
                    {
                        myAssignments = await _context.Assignments
                            .Where(a => a.ReviewerId == reviewerGuid)
                            .ToListAsync();
                             
                        // Double check: Ensure these assignments belong to submissions in the current conference?
                        // Since Assignment stores SubmissionId, and we act as Filter on the fetched items, this is fine.
                        // We are filtering the 'items' (submissions) list against 'myAssignments'.
                    }
                    else
                    {
                        _logger.LogWarning($"Reviewer UserID {reviewer.UserId} is not a valid Guid. Cannot fetch assignments.");
                    }

                    // 2. Lấy danh sách Reviews để map thông tin
                    var assignmentIds = myAssignments.Select(a => a.Id).ToList();
                    var myReviews = await _context.Reviews
                        .Where(r => assignmentIds.Contains(r.AssignmentId))
                        .ToListAsync();

                    var resultList = new List<ReviewableSubmissionDto>();

                    foreach (var item in items.EnumerateArray())
                    {
                        try
                        {
                            var paperId = string.Empty;
                            if (item.TryGetProperty("id", out var idProp)) paperId = idProp.GetString();
                            
                            // Parse paperId to Guid for comparison
                            if (!Guid.TryParse(paperId, out var paperGuid)) continue;

                            // CHỈ CHẤP NHẬN: Những bài báo đã được phân công cho người này
                            var assignmentMatch = myAssignments.FirstOrDefault(a => a.SubmissionId.ToString() == paperId);
                            if (assignmentMatch == null) continue; // Phớt lờ bài báo nếu không được phân công

                            Console.WriteLine($"[GetReviewableSubmissionsAsync] Found assignment for paper {paperId}, status {assignmentMatch.Status}");

                            var dto = new ReviewableSubmissionDto();
                        dto.Id = new Guid(paperId);
                        if (item.TryGetProperty("paperNumber", out var num)) dto.PaperNumber = num.GetInt32();
                        if (item.TryGetProperty("title", out var title)) dto.Title = title.GetString();
                        if (item.TryGetProperty("abstract", out var abs)) dto.Abstract = abs.GetString();
                        if (item.TryGetProperty("submittedAt", out var subAt)) dto.SubmittedAt = subAt.GetString();
                        if (item.TryGetProperty("trackName", out var tn)) dto.TrackName = tn.GetString();
                        if (item.TryGetProperty("fileName", out var fn)) dto.FileName = fn.GetString();
                        if (item.TryGetProperty("fileId", out var fid)) dto.FileId = fid.GetGuid();
                        if (item.TryGetProperty("fileSizeBytes", out var fsz)) dto.FileSizeBytes = fsz.GetInt64();

                        // Authors
                        if (item.TryGetProperty("authors", out var auths) && auths.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var a in auths.EnumerateArray())
                            {
                                if (a.TryGetProperty("fullName", out var fnAuth)) dto.Authors.Add(fnAuth.GetString());
                            }
                        }
                        
                        // --- Populate Review Status ---
                        dto.AssignmentId = assignmentMatch.Id;
                        
                        var reviewMatch = myReviews.FirstOrDefault(r => r.AssignmentId == assignmentMatch.Id);

                        if (reviewMatch != null)
                        {
                            dto.ReviewId = reviewMatch.Id;
                            // Phân biệt trạng thái Draft và Submitted dựa trên Assignment Status
                            dto.ReviewStatus = assignmentMatch.Status == "COMPLETED" ? "Submitted" : "Draft";
                        }
                        else
                        {
                            // Nếu đã Assigned (Accepted) nhưng chưa có Review record
                            dto.ReviewStatus = assignmentMatch.Status == "ACCEPTED" ? "Accepted" : "None"; 
                            // Nếu vẫn ở trạng thái Pending (Chờ reviewer nhấn Accept phân công)
                            if (assignmentMatch.Status == "PENDING") dto.ReviewStatus = "Pending";
                        }

                        resultList.Add(dto);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[GetReviewableSubmissionsAsync] Error processing item: {ex.Message}");
                        }
                    }
                    return resultList;
                }
            }
            return new List<ReviewableSubmissionDto>(); // Return empty list if API call fails or no items
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching submissions for reviewer");
        }

        return new List<ReviewableSubmissionDto>(); // Return empty list in case of exception
    }

    public async Task<List<ReviewableSubmissionDto>> GetAllReviewableSubmissionsAsync(string userId)
    {
        var allSubmissions = new List<ReviewableSubmissionDto>();
        try
        {
            // 0. Get user email
            string? userEmail = await GetUserEmailAsync(userId);
            _logger.LogInformation("[GetAllReviewableSubmissionsAsync] Fetching for UserId: {UserId}, Email: {Email}", userId, userEmail);

            // 1. Get all conferences where the user is a reviewer (by UserId OR Email)
            var reviewerConferences = await _context.Reviewers
                .Where(r => r.UserId == userId || (!string.IsNullOrEmpty(userEmail) && r.Email == userEmail))
                .Select(r => r.ConferenceId)
                .Distinct()
                .ToListAsync();
            
            _logger.LogInformation("[GetAllReviewableSubmissionsAsync] Found {Count} conferences for user", reviewerConferences.Count);

            var client = _httpClientFactory.CreateClient();
            var conferenceUrl = _configuration["Services:ConferenceServiceUrl"] ?? _configuration["ServiceUrls:Conference"] ?? "http://localhost:5002";
            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
            }

            foreach (var confId in reviewerConferences)
            {
                // Logic is very similar to GetReviewableSubmissionsAsync but we need ConferenceName
                var confSubmissions = await GetReviewableSubmissionsAsync(userId, confId);
                
                // Try to get conference name for each batch
                string? conferenceName = confId; // Fallback
                try
                {
                    var confResp = await client.GetAsync($"{conferenceUrl}/api/conferences/{confId}");
                    if (confResp.IsSuccessStatusCode)
                    {
                        var confContent = await confResp.Content.ReadAsStringAsync();
                        using var confDoc = JsonDocument.Parse(confContent);
                        JsonElement dataElem = confDoc.RootElement;
                        if (confDoc.RootElement.TryGetProperty("data", out var dataProp)) dataElem = dataProp;

                        if (dataElem.TryGetProperty("name", out var confName))
                            conferenceName = confName.GetString();
                        else if (dataElem.TryGetProperty("Name", out var confNameProp))
                            conferenceName = confNameProp.GetString();
                    }
                }
                catch { /* Ignore error, use ID */ }

                foreach (var sub in confSubmissions)
                {
                    sub.ConferenceId = confId;
                    sub.ConferenceName = conferenceName;
                    allSubmissions.Add(sub);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all reviewable submissions for user {UserId}", userId);
        }
        return allSubmissions.OrderByDescending(s => s.SubmittedAt).ToList();
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
            // Try claims first
            var claimsEmail = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email) 
                             ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("email");
            if (!string.IsNullOrEmpty(claimsEmail)) return claimsEmail;

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
                var respBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to fetch user from Identity Service for {UserId}. Status: {Status}. Body: {Body}", userId, response.StatusCode, respBody);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("[GetUserEmailAsync] Identity Response: {Content}", content);
            using var doc = JsonDocument.Parse(content);
            if (doc.RootElement.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
            {
                 if (data.TryGetProperty("email", out var emailProp))
                 {
                     var email = emailProp.GetString();
                     _logger.LogInformation("[GetUserEmailAsync] Extracted email: {Email}", email);
                     return email;
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