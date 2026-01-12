namespace Identity.Service.DTOs.Responses;

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public int ExpiresIn { get; set; }
    public UserDto User { get; set; } = null!;
}
