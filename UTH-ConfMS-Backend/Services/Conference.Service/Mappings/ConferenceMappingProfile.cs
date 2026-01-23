using AutoMapper;
using Conference.Service.DTOs.Requests;
using Conference.Service.DTOs.Responses;
using Conference.Service.Entities;
using ConferenceEntity = Conference.Service.Entities.Conference;

namespace Conference.Service.Mappings;

public class ConferenceMappingProfile : Profile
{
    public ConferenceMappingProfile()
    {
        // Conference mappings
        CreateMap<ConferenceEntity, ConferenceDto>()
            .ForMember(dest => dest.TracksCount, opt => opt.MapFrom(src => src.Tracks.Count))
            .ForMember(dest => dest.DeadlinesCount, opt => opt.MapFrom(src => src.Deadlines.Count));

        CreateMap<ConferenceEntity, ConferenceDetailDto>()
            .ForMember(dest => dest.Tracks, opt => opt.MapFrom(src => src.Tracks))
            .ForMember(dest => dest.Deadlines, opt => opt.MapFrom(src => src.Deadlines))
            .ForMember(dest => dest.Topics, opt => opt.MapFrom(src => src.Topics.Select(t => t.Name).ToList()));

        CreateMap<CreateConferenceRequest, ConferenceEntity>()
            .ForMember(dest => dest.ConferenceId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => "DRAFT"))
            .ForMember(dest => dest.Visibility, opt => opt.MapFrom(src => "PRIVATE"));

        CreateMap<UpdateConferenceRequest, ConferenceEntity>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Track mappings
        CreateMap<ConferenceTrack, TrackDto>();
        CreateMap<CreateTrackRequest, ConferenceTrack>()
            .ForMember(dest => dest.TrackId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

        // Deadline mappings
        CreateMap<ConferenceDeadline, DeadlineDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.DeadlineType))
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.DeadlineDate));
        CreateMap<CreateDeadlineRequest, ConferenceDeadline>()
            .ForMember(dest => dest.DeadlineId, opt => opt.Ignore())
            .ForMember(dest => dest.DeadlineType, opt => opt.MapFrom(src => src.Type ?? src.DeadlineType))
            .ForMember(dest => dest.DeadlineDate, opt => opt.MapFrom(src => src.DeadlineDate ?? src.Date))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

        // CallForPapers mappings
        CreateMap<CallForPapers, CallForPapersDto>()
            .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src.Content))
            .ForMember(dest => dest.SubmissionGuidelines, opt => opt.MapFrom(src => src.SubmissionGuidelines))
            .ForMember(dest => dest.Topics, opt => opt.Ignore());
        CreateMap<UpdateCallForPapersRequest, CallForPapers>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}
