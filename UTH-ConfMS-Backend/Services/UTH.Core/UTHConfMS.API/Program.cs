
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using UTHConfMS.Infra.Data;
using UTHConfMS.Core.Interfaces;
using UTHConfMS.Infra.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

        // =====================
        // SERVICES
        // =====================
        builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DATABASE
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS (React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// DI
builder.Services.AddScoped<IConferenceService, ConferenceService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPaperService, PaperService>();

// 1. CẤU HÌNH AUTHENTICATION (Đặt trước builder.Build)
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

app.UseHttpsRedirection();

// 🔥 QUAN TRỌNG
app.UseAuthentication();
app.UseAuthorization();

// AUTO MIGRATION
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

// SWAGGER
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();