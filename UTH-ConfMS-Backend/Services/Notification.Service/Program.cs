using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Serilog;
using Notification.Service.Data;
using Notification.Service.Entities;
using Notification.Service.Services;
using Notification.Service.Interfaces;
using Notification.Service.Configuration;
using MassTransit;
using Notification.Service.Consumers;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/notification-service-.txt", rollingInterval: RollingInterval.Day)
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
        Title = "UTH-ConfMS Notification Service API",
        Version = "v1",
        Description = "Notification & Email Service for UTH Conference Management System"
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
builder.Services.AddDbContext<NotificationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Redis configuration
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "NotificationService_";
});

// Email Settings
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));

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

        // Configure JWT for SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                
                return Task.CompletedTask;
            }
        };
    });

// Authorization Policies
builder.Services.AddAuthorization();

// Register Application Services
builder.Services.AddScoped<IEmailService, Notification.Service.Services.EmailService>();
builder.Services.AddScoped<INotificationService, Notification.Service.Services.NotificationService>();

// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// SignalR with Redis backplane
builder.Services.AddSignalR()
    .AddStackExchangeRedis(builder.Configuration.GetConnectionString("Redis")!, options =>
    {
        options.Configuration.ChannelPrefix = "NotificationService";
    });

// CORS - Updated for SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                builder.Configuration["Cors:AllowedOrigins"]?.Split(',') ?? new[] { "http://localhost:3000", "http://localhost:5173" })
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR
    });
});

// Health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddRedis(builder.Configuration.GetConnectionString("Redis")!);

// MassTransit Consumer Configuration
builder.Services.AddMassTransit(x =>
{
    // Configure Consumers
    x.AddConsumer<EmailNotificationConsumer>();
    x.AddConsumer<PaperSubmittedConsumer>();
    x.AddConsumer<ReviewAssignedConsumer>();
    x.AddConsumer<ReviewCompletedConsumer>();
    x.AddConsumer<PaperDecisionMadeConsumer>();
    x.AddConsumer<CreateNotificationConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMQ:Host"] ?? "rabbitmq", "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        // Email notifications endpoint
        cfg.ReceiveEndpoint("email-notifications", e =>
        {
            e.ConfigureConsumer<EmailNotificationConsumer>(context);
        });

        // Paper submission notifications
        cfg.ReceiveEndpoint("paper-submitted-notifications", e =>
        {
            e.ConfigureConsumer<PaperSubmittedConsumer>(context);
        });

        // Review assignment notifications
        cfg.ReceiveEndpoint("review-assigned-notifications", e =>
        {
            e.ConfigureConsumer<ReviewAssignedConsumer>(context);
        });

        // Review completion notifications
        cfg.ReceiveEndpoint("review-completed-notifications", e =>
        {
            e.ConfigureConsumer<ReviewCompletedConsumer>(context);
        });

        // Paper decision notifications
        cfg.ReceiveEndpoint("paper-decision-notifications", e =>
        {
            e.ConfigureConsumer<PaperDecisionMadeConsumer>(context);
        });

        // Generic notification creation
        cfg.ReceiveEndpoint("create-notifications", e =>
        {
            e.ConfigureConsumer<CreateNotificationConsumer>(context);
        });
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Notification Service API V1");
        c.RoutePrefix = "swagger";
    });
}

app.UseSerilogRequestLogging();



app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// Map SignalR Hub
app.MapHub<Notification.Service.Hubs.NotificationHub>("/hubs/notifications");


Log.Information("Notification Service starting...");

app.Run();
Log.Information("Notification Service stopped.");
Log.CloseAndFlush();
