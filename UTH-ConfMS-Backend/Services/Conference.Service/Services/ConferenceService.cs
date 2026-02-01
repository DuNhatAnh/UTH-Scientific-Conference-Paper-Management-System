using AutoMapper;
using Conference.Service.DTOs.Common;
using Conference.Service.DTOs.Requests;
using Conference.Service.DTOs.Responses;
using Conference.Service.Entities;
using Conference.Service.Interfaces;
using Conference.Service.Interfaces.Services;
using MassTransit;
using UTH.ConfMS.Shared.Infrastructure.EventBus;

namespace Conference.Service.Services;

public class ConferenceService : IConferenceService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ConferenceService> _logger;
    private readonly IMapper _mapper;
    private readonly Conference.Service.Integrations.IIdentityIntegration _identityIntegration;
    private readonly IPublishEndpoint _publishEndpoint;

    public ConferenceService(IUnitOfWork unitOfWork, ILogger<ConferenceService> logger, IMapper mapper, Conference.Service.Integrations.IIdentityIntegration identityIntegration, IPublishEndpoint publishEndpoint)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _mapper = mapper;
        _identityIntegration = identityIntegration;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<PagedResponse<ConferenceDto>> GetConferencesAsync(string? status, int page, int pageSize)
    {
        var totalCount = await _unitOfWork.Conferences.CountAsync(status);
        var conferences = await _unitOfWork.Conferences.GetAllAsync(status, (page - 1) * pageSize, pageSize);

        var items = _mapper.Map<List<ConferenceDto>>(conferences);

        return new PagedResponse<ConferenceDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ConferenceDetailDto> GetConferenceByIdAsync(Guid conferenceId)
    {
        var conference = await _unitOfWork.Conferences.GetByIdWithDetailsAsync(conferenceId);

        if (conference == null)
        {
            throw new InvalidOperationException("Conference not found");
        }

        return _mapper.Map<ConferenceDetailDto>(conference);
    }

    public async Task<ConferenceDto> CreateConferenceAsync(CreateConferenceRequest request, Guid createdBy)
    {
        // Check if acronym already exists
        var existing = await _unitOfWork.Conferences.GetByAcronymAsync(request.Acronym);

        if (existing != null)
        {
            throw new InvalidOperationException($"Conference with acronym '{request.Acronym}' already exists");
        }

        var conference = new Entities.Conference
        {
            ConferenceId = Guid.NewGuid(),
            Name = request.Name,
            Acronym = request.Acronym,
            Description = request.Description,
            Location = request.Location,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            SubmissionDeadline = request.SubmissionDeadline,
            Status = "DRAFT",
            Visibility = "PRIVATE",
            ReviewMode = request.ReviewMode,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Conferences.CreateAsync(conference);

        // Create default Call for Papers
        var cfp = new CallForPapers
        {
            CfpId = Guid.NewGuid(),
            ConferenceId = conference.ConferenceId,
            Title = $"{conference.Name} - Call for Papers",
            Content = "Call for Papers details will be added here.",
            AcceptedFileFormats = "PDF",
            MaxFileSizeMb = 10,
            IsPublished = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.CallForPapers.CreateAsync(cfp);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Conference {Acronym} created by user {UserId}", conference.Acronym, createdBy);

        // Sync Role to Identity Service (Assign "CONFERENCE_CHAIR" role)
        try
        {
            // Note: Role name should match Identity Service constants. Assuming "Chair" based on user context.
            // Using "Conference Chair" or just "Chair". Step 188 uses request.RoleName directly.
            // Step 144: "AUTHOR, REVIEWER, CONFERENCE_CHAIR".
            await _identityIntegration.AssignRoleAsync(createdBy, "CONFERENCE_CHAIR");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync Chair role to Identity Service for user {UserId}", createdBy);
            // Don't fail the request, just log
        }

        return _mapper.Map<ConferenceDto>(conference);
    }

    public async Task<ConferenceDto> UpdateConferenceAsync(Guid conferenceId, UpdateConferenceRequest request, Guid userId)
    {
        var conference = await _unitOfWork.Conferences.GetByIdAsync(conferenceId);
        if (conference == null)
        {
            throw new InvalidOperationException("Conference not found");
        }

        // Security Check: Only Owner or Admin can update
        // Assuming Admin role check is handled upstream or via simple logic here if roles available
        // For now, strict Owner check as requested
        if (conference.CreatedBy != userId)
        {
             throw new UnauthorizedAccessException("You are not the owner of this conference.");
        }

        if (request.Name != null) conference.Name = request.Name;
        if (request.Description != null) conference.Description = request.Description;
        if (request.Location != null) conference.Location = request.Location;
        if (request.StartDate.HasValue) conference.StartDate = request.StartDate;
        if (request.EndDate.HasValue) conference.EndDate = request.EndDate;
        if (request.SubmissionDeadline.HasValue) conference.SubmissionDeadline = request.SubmissionDeadline;
        if (request.NotificationDate.HasValue) conference.NotificationDate = request.NotificationDate;
        if (request.CameraReadyDeadline.HasValue) conference.CameraReadyDeadline = request.CameraReadyDeadline;
        if (request.Status != null) conference.Status = request.Status;
        if (request.Visibility != null) conference.Visibility = request.Visibility;

        conference.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<ConferenceDto>(conference);
    }

    public async Task DeleteConferenceAsync(Guid conferenceId, Guid userId)
    {
        var conference = await _unitOfWork.Conferences.GetByIdAsync(conferenceId);
        if (conference == null)
        {
            throw new InvalidOperationException("Conference not found");
        }

        if (conference.CreatedBy != userId)
        {
             throw new UnauthorizedAccessException("You are not the owner of this conference.");
        }

        await _unitOfWork.Conferences.DeleteAsync(conference);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Conference {ConferenceId} deleted", conferenceId);
    }

    public async Task<CallForPapersDto> GetCallForPapersAsync(Guid conferenceId)
    {
        var cfp = await _unitOfWork.CallForPapers.GetByConferenceIdAsync(conferenceId);

        if (cfp == null)
        {
            throw new InvalidOperationException("Call for Papers not found");
        }

        _logger.LogInformation("Retrieved CFP for Conf {ConfId}: ContentLength={Len}, GuidelinesLength={GLen}", 
            conferenceId, cfp.Content?.Length ?? 0, cfp.SubmissionGuidelines?.Length ?? 0);

        return _mapper.Map<CallForPapersDto>(cfp);
    }

    public async Task<CallForPapersDto> UpdateCallForPapersAsync(Guid conferenceId, UpdateCallForPapersRequest request, Guid userId)
    {
        // Check conference ownership first
        var conference = await _unitOfWork.Conferences.GetByIdAsync(conferenceId);
        if (conference == null)
        {
             throw new InvalidOperationException("Conference not found");
        }

        if (conference.CreatedBy != userId)
        {
             throw new UnauthorizedAccessException("You are not the owner of this conference.");
        }

        var cfp = await _unitOfWork.CallForPapers.GetByConferenceIdAsync(conferenceId);

        if (cfp == null)
        {
            throw new InvalidOperationException("Call for Papers not found");
        }

        if (request.Title != null) cfp.Title = request.Title;
        if (request.Content != null) cfp.Content = request.Content;
        if (request.SubmissionGuidelines != null) cfp.SubmissionGuidelines = request.SubmissionGuidelines;
        if (request.FormattingRequirements != null) cfp.FormattingRequirements = request.FormattingRequirements;
        if (request.MinPages.HasValue) cfp.MinPages = request.MinPages;
        if (request.MaxPages.HasValue) cfp.MaxPages = request.MaxPages;
        if (request.IsPublished.HasValue) cfp.IsPublished = request.IsPublished.Value;

        if (request.IsPublished == true)
        {
            if (!cfp.PublishedAt.HasValue)
            {
                 cfp.PublishedAt = DateTime.UtcNow;
            }
            
            // Always ensure status is updated if it's currently DRAFT
            if (conference.Status == "DRAFT") 
            {
                 conference.Status = "CFP_OPEN";
            }
        }
        else if (request.IsPublished == false)
        {
            // If unpublishing, revert status if it was OPEN
             if (conference.Status == "CFP_OPEN") 
            {
                 conference.Status = "DRAFT";
            }
        }

        cfp.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        return await GetCallForPapersAsync(conferenceId);
    }

    public async Task<List<TrackDto>> GetTracksAsync(Guid conferenceId)
    {
        var tracks = await _unitOfWork.Tracks.GetByConferenceIdAsync(conferenceId);
        return _mapper.Map<List<TrackDto>>(tracks);
    }

    public async Task<TrackDto> AddTrackAsync(Guid conferenceId, CreateTrackRequest request)
    {
        var conference = await _unitOfWork.Conferences.GetByIdAsync(conferenceId);
        if (conference == null)
        {
            throw new InvalidOperationException("Conference not found");
        }

        var track = new ConferenceTrack
        {
            TrackId = Guid.NewGuid(),
            ConferenceId = conferenceId,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Tracks.CreateAsync(track);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<TrackDto>(track);
    }

    public async Task DeleteTrackAsync(Guid trackId)
    {
        var track = await _unitOfWork.Tracks.GetByIdAsync(trackId);
        if (track == null)
        {
            throw new InvalidOperationException("Track not found");
        }

        await _unitOfWork.Tracks.DeleteAsync(track);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<List<DeadlineDto>> GetDeadlinesAsync(Guid conferenceId)
    {
        var deadlines = await _unitOfWork.Deadlines.GetByConferenceIdAsync(conferenceId);
        return _mapper.Map<List<DeadlineDto>>(deadlines);
    }

    public async Task<DeadlineDto> AddDeadlineAsync(Guid conferenceId, CreateDeadlineRequest request)
    {
        var conference = await _unitOfWork.Conferences.GetByIdAsync(conferenceId);
        if (conference == null)
        {
            throw new InvalidOperationException("Conference not found");
        }

        var deadline = new ConferenceDeadline
        {
            DeadlineId = Guid.NewGuid(),
            ConferenceId = conferenceId,
            DeadlineType = request.DeadlineType ?? request.Type,
            Name = request.Name ?? "Deadline",
            Description = request.Description,
            DeadlineDate = request.DeadlineDate ?? request.Date,
            Timezone = request.Timezone ?? "UTC",
            IsHardDeadline = request.IsHardDeadline ?? false,
            GracePeriodHours = request.GracePeriodHours ?? 0,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Deadlines.CreateAsync(deadline);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<DeadlineDto>(deadline);
    }

    public async Task<List<CommitteeMemberDto>> GetCommitteeMembersAsync(Guid conferenceId)
    {
        var members = await _unitOfWork.CommitteeMembers.GetByConferenceIdAsync(conferenceId);
        var dtos = _mapper.Map<List<CommitteeMemberDto>>(members);

        if (dtos.Any())
        {
            var userIds = dtos.Select(m => m.UserId).Distinct().ToList();
            try
            {
                var users = await _identityIntegration.GetUsersByIdsAsync(userIds);
                foreach (var dto in dtos)
                {
                    var user = users.FirstOrDefault(u => u.Id == dto.UserId);
                    if (user != null)
                    {
                        dto.FullName = user.FullName;
                        dto.Email = user.Email;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to enrich committee members with user details");
            }
        }

        return dtos;
    }

    public async Task<CommitteeMemberDto> AddCommitteeMemberAsync(Guid conferenceId, AddCommitteeMemberRequest request)
    {
        var conference = await _unitOfWork.Conferences.GetByIdAsync(conferenceId);
        if (conference == null) throw new InvalidOperationException("Conference not found");

        var existing = await _unitOfWork.CommitteeMembers.GetByConferenceAndUserAsync(conferenceId, request.UserId);
        if (existing != null)
        {
             throw new InvalidOperationException("User is already a committee member");
        }

        var member = new CommitteeMember
        {
             MemberId = Guid.NewGuid(),
             ConferenceId = conferenceId,
             UserId = request.UserId,
             Role = request.Role,
             CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.CommitteeMembers.CreateAsync(member);
        await _unitOfWork.SaveChangesAsync();

        // Send Email Notification
        try 
        {
            var user = (await _identityIntegration.GetUsersByIdsAsync(new List<Guid> { request.UserId })).FirstOrDefault();
            if (user != null && !string.IsNullOrEmpty(user.Email))
            {
                // 1. Send In-App Notification
                await _publishEndpoint.Publish(new CreateNotificationEvent
                {
                    UserId = user.Id,
                    NotificationType = "INVITATION",
                    Title = "Invitation to Program Committee",
                    Message = $"You have been invited to join the Program Committee for {conference.Acronym} as {request.Role}.",
                    ActionUrl = $"/conferences/{conference.ConferenceId}",
                    SendEmail = false 
                });

                // 2. Send Email Notification
                await _publishEndpoint.Publish(new SendEmailEvent
                {
                    ToEmail = user.Email,
                    Subject = $"[UTH-ConfMS] Invitation to Program Committee: {conference.Name} ({conference.Acronym})",
                    Body = $@"
                        <h1>Invitation to Program Committee</h1>
                        <p>Dear {user.FullName},</p>
                        <p>You have been invited to join the Program Committee for the conference <strong>{conference.Name} ({conference.Acronym})</strong>.</p>
                        <p>Your role: <strong>{request.Role}</strong></p>
                        <p>Please log in to the system to view details and manage your assignments.</p>
                        <p><a href='http://localhost:3000/invite/accept?conference={conference.ConferenceId}'>Click here to access</a></p>
                        <br/>
                        <p>Best regards,</p>
                        <p>UTH Conference Management System</p>"
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish SendEmailEvent for user {UserId}", request.UserId);
            // Don't block the main flow
        }

        // Sync Role to Identity Service (Assign "REVIEWER" or role from request)
        try
        {
            // request.Role usually is "Reviewer" or "Chair". Map to Identity Role Name.
            // If request.Role is "Program Committee", maybe map to "REVIEWER"?
            // Assuming request.Role is valid Identity Role for now, or "REVIEWER" as fallback.
            string targetRole = request.Role?.ToUpper() == "CHAIR" ? "CONFERENCE_CHAIR" : "REVIEWER";
            
            await _identityIntegration.AssignRoleAsync(request.UserId, targetRole);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync role {Role} to Identity Service for user {UserId}", request.Role, request.UserId);
        }

        return _mapper.Map<CommitteeMemberDto>(member);
    }

    public async Task RemoveCommitteeMemberAsync(Guid conferenceId, Guid userId)
    {
        var member = await _unitOfWork.CommitteeMembers.GetByConferenceAndUserAsync(conferenceId, userId);
        if (member == null)
        {
             throw new InvalidOperationException("Member not found in this conference");
        }

        await _unitOfWork.CommitteeMembers.DeleteAsync(member);
        await _unitOfWork.SaveChangesAsync();
    }


}
