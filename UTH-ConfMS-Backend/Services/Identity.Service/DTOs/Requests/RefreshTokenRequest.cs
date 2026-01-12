using System.ComponentModel.DataAnnotations;

namespace Identity.Service.DTOs.Requests;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
