using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Review.Service.Entities;

public class Reviewer
{
    [Key]
    public int Id { get; set; }
    
    public string UserId { get; set; } // ID từ Identity Service (GUID string)
    public string FullName { get; set; }
    public string Email { get; set; }
    public int ConferenceId { get; set; }
    public string Expertise { get; set; } // Các từ khóa chuyên môn, phân cách bằng dấu phẩy
    public int MaxPapers { get; set; } = 5; // Số bài tối đa có thể review
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}