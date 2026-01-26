using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Identity.Service.Entities;

public class UserActivityLog
{
    [Key]
    public Guid LogId { get; set; }

    [Required]
    public Guid ActorId { get; set; } // Who performed the action

    [Required]
    public string Action { get; set; } // e.g. "ASSIGN_ROLE", "REMOVE_ROLE"

    [Required]
    public string EntityType { get; set; } // e.g. "USER_ROLE"

    [Required]
    public string EntityId { get; set; } // ID of the affected entity

    public string? Description { get; set; }
    
    public string? OldValue { get; set; } // JSON or text
    
    public string? NewValue { get; set; } // JSON or text

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation (Optional, might be null if Actor is system or deleted)
    [ForeignKey("ActorId")]
    public virtual User? Actor { get; set; }
}
