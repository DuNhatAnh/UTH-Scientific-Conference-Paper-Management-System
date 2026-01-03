using UTHConfMS.Core.DTOs;
using UTHConfMS.Core.Entities;

namespace UTHConfMS.Core.Interfaces
{
    public interface IAuthService
    {
        // Hàm đăng ký: Trả về (Thành công/Thất bại, Lời nhắn, User vừa tạo)
        Task<(bool IsSuccess, string ErrorMessage, User? User)> RegisterAsync(RegisterDTO dto);

        // Hàm đăng nhập
        Task<(bool IsSuccess, string Token, string ErrorMessage)> LoginAsync(LoginDTO dto);
    }
}