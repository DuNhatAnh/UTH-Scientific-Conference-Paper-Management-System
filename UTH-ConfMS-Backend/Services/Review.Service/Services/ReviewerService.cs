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

    public ReviewerService(ReviewDbContext context, ILogger<ReviewerService> logger, IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
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
            // Lấy cấu hình từ appsettings.json (hoặc biến môi trường)
            var notificationServiceUrl = _configuration["ServiceUrls:Notification"] ?? "http://localhost:5005";
            var frontendUrl = _configuration["ServiceUrls:Frontend"] ?? "http://localhost:3000";

            var client = _httpClientFactory.CreateClient();
            var emailPayload = new 
            {
                To = dto.Email,
                Subject = "Invitation to PC Member - UTH ConfMS",
                Body = $"Dear {dto.FullName},<br/>You have been invited to be a reviewer. Click here to accept: <a href='{frontendUrl}/invite/accept?token={invitation.Token}'>Accept Invitation</a>"
            };

            var content = new StringContent(JsonSerializer.Serialize(emailPayload), Encoding.UTF8, "application/json");
            
            // Giả định Notification Service có endpoint này (dựa trên kiến trúc microservices)
            var response = await client.PostAsync($"{notificationServiceUrl}/api/notifications/send-email", content);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Failed to send email to {dto.Email}. Status: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error communicating with Notification Service for {dto.Email}");
            // Không throw exception ở đây để tránh rollback transaction mời thành công
        }
        
        return invitation;
    }

    public async Task<bool> RespondToInvitationAsync(InvitationResponseDTO dto, int? userId = null)
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
            if (!userId.HasValue)
            {
                throw new ArgumentException("User ID is required to accept the invitation.");
            }

            // Kiểm tra xem user đã là Reviewer chưa để tránh lỗi trùng lặp
            var alreadyExists = await _context.Reviewers
                .AnyAsync(r => r.UserId == userId.Value && r.ConferenceId == invitation.ConferenceId);

            if (!alreadyExists)
            {
                // Thêm vào bảng Reviewers
                var reviewer = new Reviewer
                {
                    UserId = userId.Value,
                    ConferenceId = invitation.ConferenceId,
                    Email = invitation.Email,
                    FullName = invitation.FullName,
                    Expertise = "General", // Mặc định, user sẽ cập nhật sau
                };
                _context.Reviewers.Add(reviewer);
            }
            else
            {
                _logger.LogWarning($"User {userId} is already a reviewer for conference {invitation.ConferenceId}.");
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Reviewer>> GetReviewersByConferenceAsync(int conferenceId)
        => await _context.Reviewers.Where(r => r.ConferenceId == conferenceId).ToListAsync();

    public async Task<List<ReviewerInvitation>> GetInvitationsByConferenceAsync(int conferenceId)
        => await _context.ReviewerInvitations.Where(i => i.ConferenceId == conferenceId).ToListAsync();
}