using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Serilog;
using FluentValidation;
using FluentValidation.AspNetCore;
using Review.Service.Data;
using Review.Service.Services;
using Review.Service.Interfaces;
// using Review.Service.DTOs.Common; // TODO: Add DTOs
// using Review.Service.DTOs.Requests; // TODO: Add DTOs
// using Review.Service.DTOs.Responses; // TODO: Add DTOs
using Review.Service.Entities;
// using Review.Service.Validators; // TODO: Add validators
using Review.Service.Interfaces;
// using Review.Service.Interfaces.Repositories; // TODO: Add interface repositories
// using Review.Service.Interfaces.Services; // TODO: Add interface services
// using Review.Service.Repositories; // TODO: Add repositories

// Enable legacy timestamp behavior for Npgsql to avoid DateTime Kind issues with PostgreSQL 'timestamp' type
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/review-service-.txt", rollingInterval: RollingInterval.Day)
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
        Title = "UTH-ConfMS Review Service API",
        Version = "v1",
        Description = "Peer Review Service for UTH Conference Management System"
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
builder.Services.AddDbContext<ReviewDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Redis configuration
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "ReviewService_";
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
    options.AddPolicy("RequireReviewCreate", policy =>
        policy.RequireRole("REVIEWER", "PC_MEMBER", "CONFERENCE_CHAIR", "SYSTEM_ADMIN"));
    
    options.AddPolicy("RequireReviewManage", policy =>
        policy.RequireRole("PC_CHAIR", "CONFERENCE_CHAIR", "SYSTEM_ADMIN"));
});

// Register Application Services
// TODO: Implement these services and repositories
// builder.Services.AddScoped<IUnitOfWork, Review.Service.Repositories.UnitOfWork>();
// builder.Services.AddScoped<IReviewRepository, Review.Service.Repositories.ReviewRepository>();
// builder.Services.AddScoped<IReviewAssignmentRepository, Review.Service.Repositories.ReviewAssignmentRepository>();
// builder.Services.AddScoped<IDecisionRepository, Review.Service.Repositories.DecisionRepository>();
builder.Services.AddScoped<IReviewService, Review.Service.Services.ReviewService>();
builder.Services.AddScoped<IAssignmentService, Review.Service.Services.AssignmentService>();

// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
// builder.Services.AddValidatorsFromAssemblyContaining<SubmitReviewRequestValidator>(); // TODO: Add validators

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
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!);

builder.Services.AddHttpClient();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IReviewerService, Review.Service.Services.ReviewerService>();


var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Review Service API V1");
        c.RoutePrefix = "swagger";
    });

    // Auto-migrate database in Development
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ReviewDbContext>();
        // Fix: Create tables manually because EnsureCreated fails on shared DB
        try {
            dbContext.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Reviewers"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""Email"" TEXT,
                    ""FullName"" TEXT,
                    ""UserId"" TEXT,
                    ""ConferenceId"" TEXT,
                    ""Expertise"" TEXT,
                    ""MaxPapers"" INT DEFAULT 5,
                    ""CreatedAt"" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ""Token"" TEXT,
                    ""IsActive"" BOOLEAN DEFAULT TRUE
                );
                
                CREATE TABLE IF NOT EXISTS ""Assignments"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""PaperId"" TEXT,
                    ""ReviewerId"" INT REFERENCES ""Reviewers""(""Id""),
                    ""Status"" TEXT,
                    ""AssignedDate"" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS ""Reviews"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""AssignmentId"" INT REFERENCES ""Assignments""(""Id""),
                    ""NoveltyScore"" INT,
                    ""MethodologyScore"" INT,
                    ""PresentationScore"" INT,
                    ""Recommendation"" TEXT,
                    ""CommentsForAuthor"" TEXT,
                    ""ConfidentialComments"" TEXT,
                    ""CreatedAt"" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ""UpdatedAt"" TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS ""ReviewerInvitations"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""ConferenceId"" TEXT,
                    ""Email"" TEXT,
                    ""FullName"" TEXT,
                    ""Status"" TEXT,
                    ""Token"" TEXT,
                    ""SentAt"" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ""RespondedAt"" TIMESTAMP
                );
            ");
            Log.Information("Database tables checked/created successfully.");
            
             // MIGRATION: Auto-fix ConferenceId type if it is INT
                try {
                     dbContext.Database.ExecuteSqlRaw(@"
                        DO $$ 
                        BEGIN 
                            IF EXISTS (SELECT 1 
                                       FROM information_schema.columns 
                                       WHERE table_name = 'Reviewers' 
                                       AND column_name = 'ConferenceId' 
                                       AND data_type = 'integer') THEN
                                ALTER TABLE ""Reviewers"" ALTER COLUMN ""ConferenceId"" TYPE TEXT USING ""ConferenceId""::TEXT;
                            END IF;
                        END $$;
                    ");
                     dbContext.Database.ExecuteSqlRaw(@"
                        DO $$ 
                        BEGIN 
                            IF EXISTS (SELECT 1 
                                       FROM information_schema.columns 
                                       WHERE table_name = 'ReviewerInvitations' 
                                       AND column_name = 'ConferenceId' 
                                       AND data_type = 'integer') THEN
                                ALTER TABLE ""ReviewerInvitations"" ALTER COLUMN ""ConferenceId"" TYPE TEXT USING ""ConferenceId""::TEXT;
                            END IF;
                        END $$;
                    ");
                     Log.Information("Database migration (INT -> TEXT) checked/executed successfully.");
                } catch (Exception ex) {
                     Log.Warning($"Error migrating table columns: {ex.Message}");
                }
        } catch (Exception ex) {
            Log.Error(ex, "Error creating tables.");
        }
    }
}

app.UseSerilogRequestLogging();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

Log.Information("Review Service starting...");
app.Run();
Log.Information("Review Service stopped.");
Log.CloseAndFlush();