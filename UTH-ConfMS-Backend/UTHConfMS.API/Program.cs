using Microsoft.EntityFrameworkCore;
using UTHConfMS.Infra.Data;

var builder = WebApplication.CreateBuilder(args);


// 1. Add DbContext (Kết nối SQL Server)

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Add Controllers
builder.Services.AddControllers();
// 3. Add Swagger (API Docs)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
// 4. Use Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// 5. Middleware
app.UseHttpsRedirection();

app.UseAuthorization();

// 6. Map Controllers
app.MapControllers();

app.Run();
