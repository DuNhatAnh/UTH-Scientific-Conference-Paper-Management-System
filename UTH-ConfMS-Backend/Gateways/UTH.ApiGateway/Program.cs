using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

// 1. CẤU HÌNH CORS (Cho phép React truy cập)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // Cho phép Frontend
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

// 2. KÍCH HOẠT CORS (Phải đặt TRƯỚC UseOcelot)
app.UseCors("AllowReactApp");

await app.UseOcelot();

app.Run();