using System.ComponentModel.DataAnnotations;

namespace Identity.Service.DTOs.Requests;

public class AssignRoleRequest
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid RoleId { get; set; }

    public Guid? ConferenceId { get; set; }

    public Guid? TrackId { get; set; }
    
    public DateTime? ExpiresAt { get; set; }
}
