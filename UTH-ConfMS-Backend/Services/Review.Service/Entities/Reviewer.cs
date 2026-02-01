using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Review.Service.Entities;

public class Reviewer
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }
    
    public string UserId { get; set; } = string.Empty; // ID từ Identity Service (GUID string)
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ConferenceId { get; set; } = string.Empty;
    public string Expertise { get; set; } = string.Empty; // Các từ khóa chuyên môn, phân cách bằng dấu phẩy
    public int MaxPapers { get; set; } = 5; // Số bài tối đa có thể review
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // NOTE: ReviewerId in Assignment table is a Guid that maps to UserId (not to this int Id)
    // This Reviewer entity is a local cache/lookup table with auto-increment int PK
}