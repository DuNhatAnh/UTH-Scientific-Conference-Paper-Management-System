using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration; // Để đọc appsettings
using Microsoft.IdentityModel.Tokens;     // Để ký Token
using System.IdentityModel.Tokens.Jwt;    // Để tạo Token
using System.Security.Claims;             // Để lưu thông tin vào Token
using System.Text;
using UTHConfMS.Core.DTOs;
using UTHConfMS.Core.Entities;
using UTHConfMS.Core.Interfaces;
using UTHConfMS.Infra.Data;

namespace UTHConfMS.Infra.Services
{
	public class AuthService : IAuthService
	{
		private readonly AppDbContext _context;
		private readonly IConfiguration _configuration;

		public AuthService(AppDbContext context, IConfiguration configuration)
		{
			_context = context;
			_configuration = configuration;
		}

		public async Task<(bool IsSuccess, string ErrorMessage, User? User)> RegisterAsync(RegisterDTO dto)
		{
			// 1. Kiểm tra Email trùng
			var exists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
			if (exists)
			{
				return (false, "Email này đã được sử dụng!", null);
			}

			// 2. Tạo User mới và MÃ HÓA MẬT KHẨU
			var user = new User
			{
				FullName = dto.FullName,
				Email = dto.Email,
				Role = "Author", // Mặc định ai đăng ký cũng là Tác giả

				// Mã hóa mật khẩu tại đây
				PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
			};

			// 3. Lưu xuống DB
			try
			{
				_context.Users.Add(user);
				await _context.SaveChangesAsync();
				return (true, "", user);
			}
			catch (Exception ex)
			{
				return (false, $"Lỗi hệ thống: {ex.Message}", null);
			}
		}

		public async Task<(bool IsSuccess, string Token, string ErrorMessage)> LoginAsync(LoginDTO dto)
		{
			// 1. Tìm User theo Email
			var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
			if (user == null)
			{
				return (false, "Email không tồn tại!", "");
			}

			// 2. Kiểm tra Mật khẩu
			bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
			if (!isPasswordValid)
			{
				return (false, "Sai mật khẩu!", "");
			}

			// 3. Tạo Token (Cấp vòng tay)
			var token = GenerateJwtToken(user);

			return (true, token, "");
		}

		// Hàm phụ để sinh Token
		private string GenerateJwtToken(User user)
		{
			var jwtSettings = _configuration.GetSection("JwtSettings");
			var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]);

			var claims = new[]
			{
				new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
				new Claim(ClaimTypes.Email, user.Email),
				new Claim(ClaimTypes.Role, user.Role), // Quan trọng: Lưu Role để phân quyền
                new Claim(ClaimTypes.Name, user.FullName)
			};

			var tokenDescriptor = new SecurityTokenDescriptor
			{
				Subject = new ClaimsIdentity(claims),
				Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["DurationInMinutes"])),
				Issuer = jwtSettings["Issuer"],
				Audience = jwtSettings["Audience"],
				SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
			};

			var tokenHandler = new JwtSecurityTokenHandler();
			var token = tokenHandler.CreateToken(tokenDescriptor);
			return tokenHandler.WriteToken(token);
		}
	}
}