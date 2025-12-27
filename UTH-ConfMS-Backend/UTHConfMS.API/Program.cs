using Microsoft.EntityFrameworkCore;
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

// (CHUẨN BỊ CHO LOGIN / JWT – dù chưa dùng token)
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

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
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        context.Database.Migrate();
        Console.WriteLine("--> Database Migration Successful!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"--> Database Migration Failed: {ex.Message}");
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
