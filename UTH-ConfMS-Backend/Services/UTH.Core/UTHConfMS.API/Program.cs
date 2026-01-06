using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using UTHConfMS.Infra.Data;
using UTHConfMS.Core.Interfaces;
using UTHConfMS.Infra.Services;

// Fix lỗi ngày tháng của PostgreSQL
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// =====================
// SERVICES
// =====================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 1. DATABASE
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. CORS (React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// 3. DI (DEPENDENCY INJECTION) - CÁC SERVICE
// --- Các service cũ ---
builder.Services.AddScoped<IConferenceService, ConferenceService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPaperService, PaperService>();

// --- 🔥 [MỚI] THÊM CÁC DÒNG NÀY ĐỂ CHẠY MODULE MỚI ---
builder.Services.AddScoped<ITrackService, TrackService>(); // Quản lý chủ đề
builder.Services.AddScoped<IAssignmentService, AssignmentService>(); // Phân công
builder.Services.AddScoped<IReviewService, ReviewService>(); // Đánh giá

// Đăng ký File Storage (Lưu file vào thư mục wwwroot của API)
builder.Services.AddScoped<IFileStorageService>(provider => 
    new LocalFileStorageService(builder.Environment.WebRootPath));
// -----------------------------------------------------

// 4. CẤU HÌNH AUTHENTICATION
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        ClockSkew = TimeSpan.Zero
    };
});

var app = builder.Build();

// =====================
// MIDDLEWARE
// =====================
app.UseCors("AllowReactApp");

// --- 🔥 [MỚI] QUAN TRỌNG: CHO PHÉP TRUY CẬP FILE TĨNH (PDF) ---
app.UseStaticFiles(); 
// ------------------------------------------------------------

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// SWAGGER
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// AUTO MIGRATION (Giữ nguyên logic của bạn)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<AppDbContext>();

    try
    {
        logger.LogInformation("--> Đang khởi tạo Database...");
        if (context.Database.CanConnect())
        {
            logger.LogInformation("--> Kết nối thành công!");
            // Lưu ý: Nếu muốn dùng Migration chuẩn thì đổi thành context.Database.Migrate();
            // Nhưng dùng EnsureCreated() cho đồ án cũng OK.
            context.Database.EnsureCreated(); 
            logger.LogInformation("--> Đã tạo bảng (Schema) thành công!");
        }
        else
        {
            logger.LogError("--> Không thể kết nối DB dù Docker bảo đã Healthcheck!");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "--> Lỗi nghiêm trọng khi khởi tạo DB");
    }
}

app.MapControllers();

app.Run();