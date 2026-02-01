using AutoMapper;
using Notification.Service.DTOs.Requests;
using Notification.Service.DTOs.Responses;
using Notification.Service.Entities;

namespace Notification.Service.Mappings;

public class NotificationMappingProfile : Profile
{
    public NotificationMappingProfile()
    {
        // Notification mappings
        CreateMap<Entities.Notification, NotificationDto>();
        
        CreateMap<NotificationDto, Entities.Notification>()
            .ForMember(dest => dest.NotificationId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.IsRead, opt => opt.MapFrom(src => false));

        // Email mappings
        CreateMap<EmailRequest, EmailDto>();
    }
}

public class EmailDto
{
    public string ToEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; }
}
