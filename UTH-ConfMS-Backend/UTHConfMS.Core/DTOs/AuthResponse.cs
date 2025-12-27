namespace UTHConfMS.Core.DTOs
{
    public class AuthResponse
    {
        public int UserId { get; set; }
        public string Email { get; set; } = null!;
        public string Token { get; set; } = null!;
    }
}
