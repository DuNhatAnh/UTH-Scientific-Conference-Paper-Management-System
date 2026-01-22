using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Serilog;
using FluentValidation;
using FluentValidation.AspNetCore;
using Identity.Service.Data;
using Identity.Service.Services;
using Identity.Service.Validators; // TODO: Add validators
using Identity.Service.Interfaces;
using Identity.Service.Interfaces.Repositories; // TODO: Add interface repositories
using Identity.Service.Interfaces.Services; // TODO: Add interface services
using Identity.Service.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/identity-service-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();

// Swagger configuration
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "UTH-ConfMS Identity Service API",
        Version = "v1",
        Description = "Identity and Authentication Service for UTH Conference Management System"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database configuration
builder.Services.AddDbContext<IdentityDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Redis configuration
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "IdentityService_";
});

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JWT");
var secretKey = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdminRole", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c =>
                // 1. Chấp nhận cả tên claim chuẩn ("role") và tên claim .NET (ClaimTypes.Role)
                (c.Type == "role" || c.Type == System.Security.Claims.ClaimTypes.Role) &&

                // 2. Kiểm tra giá trị role có phải là Admin không (Chấp nhận nhiều biến thể)
                (c.Value.Equals("Administrator", StringComparison.OrdinalIgnoreCase) ||
                 c.Value.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                 c.Value.Equals("SystemAdmin", StringComparison.OrdinalIgnoreCase) ||
                 c.Value.Equals("SYSTEM_ADMIN", StringComparison.OrdinalIgnoreCase))
            )
        ));
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register Application Services
builder.Services.AddScoped<IUnitOfWork, Identity.Service.Repositories.UnitOfWork>(); // TODO: Implement UnitOfWork
builder.Services.AddScoped<IUserRepository, Identity.Service.Repositories.UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, Identity.Service.Repositories.RefreshTokenRepository>(); // TODO: Implement RefreshTokenRepository
builder.Services.AddScoped<IRoleRepository, Identity.Service.Repositories.RoleRepository>(); // TODO: Implement RoleRepository
builder.Services.AddScoped<IAuthService, Identity.Service.Services.AuthService>();
builder.Services.AddScoped<IUserService, Identity.Service.Services.UserService>(); // TODO: Implement UserService
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>(); // TODO: Implement JwtTokenService
builder.Services.AddSingleton<UTH.ConfMS.Shared.Infrastructure.Audit.IAuditLogger, UTH.ConfMS.Shared.Infrastructure.Audit.KafkaAuditLogger>();


// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

// MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// Health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddRedis(builder.Configuration.GetConnectionString("Redis")!);

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Identity Service API V1");
        c.RoutePrefix = "swagger";
    });
}

app.UseSerilogRequestLogging();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
