using System.ComponentModel.DataAnnotations;

namespace Identity.Service.DTOs.Requests;

public class ChangePasswordRequest
{
    [Required]
    public string OldPassword { get; set; } = string.Empty;
    
    public string CurrentPassword { get => OldPassword; set => OldPassword = value; }

    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [Compare("NewPassword")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
