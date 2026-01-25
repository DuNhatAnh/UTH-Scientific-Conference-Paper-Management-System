using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Serilog;
using FluentValidation;
using FluentValidation.AspNetCore;
using Conference.Service.Data;
using Conference.Service.Validators; // TODO: Add validators
using Conference.Service.Interfaces;
using Conference.Service.Interfaces.Repositories; // TODO: Add interface repositories
using Conference.Service.Interfaces.Services; // TODO: Add interface services
using Conference.Service.Repositories; // TODO: Add repositories
using MassTransit;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/conference-service-.txt", rollingInterval: RollingInterval.Day)
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
        Title = "UTH-ConfMS Conference Service API",
        Version = "v1",
        Description = "Conference Management Service for UTH Conference Management System"
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
builder.Services.AddDbContext<ConferenceDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Redis configuration
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "ConferenceService_";
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
    options.AddPolicy("RequireConferenceCreate", policy =>
        policy.RequireRole("SYSTEM_ADMIN", "CONFERENCE_CHAIR"));
    
    options.AddPolicy("RequireConferenceUpdate", policy =>
        policy.RequireRole("SYSTEM_ADMIN", "CONFERENCE_CHAIR"));
    
    options.AddPolicy("RequireConferenceDelete", policy =>
        policy.RequireRole("SYSTEM_ADMIN", "CONFERENCE_CHAIR"));
    
    options.AddPolicy("RequireConferenceManage", policy =>
        policy.RequireRole("SYSTEM_ADMIN", "CONFERENCE_CHAIR", "PC_CHAIR"));
});

// Register Application Services
// TODO: Implement these services
builder.Services.AddScoped<IUnitOfWork, Conference.Service.Repositories.UnitOfWork>();
builder.Services.AddScoped<IConferenceRepository, Conference.Service.Repositories.ConferenceRepository>();
builder.Services.AddScoped<ITrackRepository, Conference.Service.Repositories.TrackRepository>();
builder.Services.AddScoped<IDeadlineRepository, Conference.Service.Repositories.DeadlineRepository>();
builder.Services.AddScoped<ICallForPapersRepository, Conference.Service.Repositories.CallForPapersRepository>();
builder.Services.AddScoped<IConferenceService, Conference.Service.Services.ConferenceService>();

// Integrations
builder.Services.AddHttpClient<Conference.Service.Integrations.IIdentityIntegration, Conference.Service.Integrations.HttpIdentityIntegration>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["IdentityService:BaseUrl"] ?? "http://identity-service:5001");
});

// MassTransit
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitMqHost = builder.Configuration.GetConnectionString("RabbitMQ") ?? "rabbitmq";
        cfg.Host(rabbitMqHost, "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });
    });
});

// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<CreateConferenceRequestValidator>(); // TODO: Add validators

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

builder.Services.AddHttpContextAccessor(); // Required for Token Propagation

// Health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!);

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Conference Service API V1");
        c.RoutePrefix = "swagger";
    });
}

app.UseSerilogRequestLogging();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

Log.Information("Conference Service starting...");
app.Run();
Log.Information("Conference Service stopped.");
Log.CloseAndFlush();
