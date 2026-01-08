using Microsoft.AspNetCore.Mvc;
using UTHConfMS.Core.DTOs;
using UTHConfMS.Core.Interfaces;

namespace UTHConfMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDTO dto)
        {
            var result = await _authService.RegisterAsync(dto);

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Ok(new
            {
                message = "Đăng ký thành công!",
                userId = result.User?.Id,
                email = result.User?.Email
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (!result.IsSuccess)
            {
                return Unauthorized(new { message = result.ErrorMessage });
            }

            return Ok(new
            {
                message = "Đăng nhập thành công!",
                token = result.Token // Trả về token JWT cho Frontend sử dụng 
            });
        }
    }
}