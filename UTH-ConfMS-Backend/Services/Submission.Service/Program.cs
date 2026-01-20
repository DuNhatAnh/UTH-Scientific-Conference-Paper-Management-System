using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Serilog;
using FluentValidation;
using FluentValidation.AspNetCore;
using Submission.Service.Data;
using Submission.Service.Services;
using Submission.Service.Validators;
using Submission.Service.DTOs.Common;
using Submission.Service.DTOs.Requests;
using Submission.Service.DTOs.Responses;
using Submission.Service.Entities;
using Submission.Service.Interfaces;
using Submission.Service.Interfaces.Repositories;
using Submission.Service.Interfaces.Services;
using Submission.Service.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/submission-service-.txt", rollingInterval: RollingInterval.Day)
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
        Title = "UTH-ConfMS Submission Service API",
        Version = "v1",
        Description = "Paper Submission Service for UTH Conference Management System"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
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
builder.Services.AddDbContext<SubmissionDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Redis configuration
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "SubmissionService_";
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

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireSubmissionCreate", policy =>
        policy.RequireRole("AUTHOR", "PC_MEMBER", "REVIEWER", "CONFERENCE_CHAIR", "SYSTEM_ADMIN"));
    
    options.AddPolicy("RequireConferenceChair", policy =>
        policy.RequireRole("CONFERENCE_CHAIR", "PC_CHAIR", "SYSTEM_ADMIN"));
});

// Register Application Services
// Register Application Services
builder.Services.AddScoped<IUnitOfWork, Submission.Service.Repositories.UnitOfWork>();
builder.Services.AddScoped<ISubmissionRepository, Submission.Service.Repositories.SubmissionRepository>();
builder.Services.AddScoped<IAuthorRepository, Submission.Service.Repositories.AuthorRepository>();
builder.Services.AddScoped<ISubmissionFileRepository, Submission.Service.Repositories.SubmissionFileRepository>();
builder.Services.AddScoped<ISubmissionService, Submission.Service.Services.SubmissionService>();
builder.Services.AddSingleton<IFileStorageService, Submission.Service.Services.FileStorageService>();

// Register AI Service (free implementations)
builder.Services.AddHttpClient<IAIService, Submission.Service.Services.AIService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<CreateSubmissionRequestValidator>();

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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Submission Service API V1");
        c.RoutePrefix = "swagger";
    });
}

app.UseSerilogRequestLogging();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

Log.Information("Submission Service starting...");
app.Run();
Log.Information("Submission Service stopped.");
Log.CloseAndFlush();
