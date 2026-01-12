using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Conference.Service.Entities;

[Table("conference_tracks")]
public class ConferenceTrack
{
    [Key]
    [Column("track_id")]
    public Guid TrackId { get; set; }

    [Column("conference_id")]
    public Guid ConferenceId { get; set; }

    [Column("name")]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ConferenceId")]
    public virtual Conference Conference { get; set; } = null!;
}
