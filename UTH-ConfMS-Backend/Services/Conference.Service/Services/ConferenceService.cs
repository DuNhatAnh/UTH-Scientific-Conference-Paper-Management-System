using AutoMapper;
using Conference.Service.DTOs.Common;
using Conference.Service.DTOs.Requests;
using Conference.Service.DTOs.Responses;
using Conference.Service.Entities;
using Conference.Service.Interfaces;
using Conference.Service.Interfaces.Services;

namespace Conference.Service.Services;

public class ConferenceService : IConferenceService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ConferenceService> _logger;
    private readonly IMapper _mapper;

    public ConferenceService(IUnitOfWork unitOfWork, ILogger<ConferenceService> logger, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<PagedResponse<ConferenceDto>> GetConferencesAsync(string? status, int page, int pageSize)
    {
        var totalCount = await _unitOfWork.Conferences.CountAsync(status);
        var conferences = await _unitOfWork.Conferences.GetAllAsync(status, (page - 1) * pageSize, pageSize);

        var items = _mapper.Map<List<ConferenceDto>>(conferences);

        return new PagedResponse<ConferenceDto>
        {
            Data = items,
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

        return _mapper.Map<ConferenceDto>(conference);
    }

    public async Task<ConferenceDto> UpdateConferenceAsync(Guid conferenceId, UpdateConferenceRequest request)
    {
        var conference = await _unitOfWork.Conferences.GetByIdAsync(conferenceId);
        if (conference == null)
        {
            throw new InvalidOperationException("Conference not found");
        }

        if (request.Name != null) conference.Name = request.Name;
        if (request.Description != null) conference.Description = request.Description;
        if (request.Location != null) conference.Location = request.Location;
        if (request.StartDate.HasValue) conference.StartDate = request.StartDate;
        if (request.EndDate.HasValue) conference.EndDate = request.EndDate;
        if (request.Status != null) conference.Status = request.Status;
        if (request.Visibility != null) conference.Visibility = request.Visibility;

        conference.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<ConferenceDto>(conference);
    }

    public async Task DeleteConferenceAsync(Guid conferenceId)
    {
        var conference = await _unitOfWork.Conferences.GetByIdAsync(conferenceId);
        if (conference == null)
        {
            throw new InvalidOperationException("Conference not found");
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

        return _mapper.Map<CallForPapersDto>(cfp);
    }

    public async Task<CallForPapersDto> UpdateCallForPapersAsync(Guid conferenceId, UpdateCallForPapersRequest request)
    {
        var cfp = await _unitOfWork.CallForPapers.GetByConferenceIdAsync(conferenceId);

        if (cfp == null)
        {
            throw new InvalidOperationException("Call for Papers not found");
        }

        if (request.Title != null) cfp.Title = request.Title;
        if (request.Content != null) cfp.Content = request.Content;
        cfp.SubmissionGuidelines = request.SubmissionGuidelines;
        cfp.FormattingRequirements = request.FormattingRequirements;
        cfp.MinPages = request.MinPages;
        cfp.MaxPages = request.MaxPages;
        if (request.IsPublished.HasValue) cfp.IsPublished = request.IsPublished.Value;

        if (request.IsPublished == true && !cfp.PublishedAt.HasValue)
        {
            cfp.PublishedAt = DateTime.UtcNow;
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
            Name = request.Name,
            Description = request.Description,
            DeadlineDate = request.DeadlineDate ?? request.Date,
            Timezone = request.Timezone,
            IsHardDeadline = request.IsHardDeadline ?? false,
            GracePeriodHours = request.GracePeriodHours ?? 0,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Deadlines.CreateAsync(deadline);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<DeadlineDto>(deadline);
    }
}
