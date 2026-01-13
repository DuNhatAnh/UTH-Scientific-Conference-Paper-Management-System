using Microsoft.EntityFrameworkCore;
using Review.Service.Entities;

namespace Review.Service.Data;

public class ReviewDbContext : DbContext
{
    public ReviewDbContext(DbContextOptions<ReviewDbContext> options)
        : base(options) { }

    public DbSet<Assignment> Assignments { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<Decision> Decisions { get; set; }
    public DbSet<Conflict> Conflicts { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Review)
            .WithOne(r => r.Assignment)
            .HasForeignKey<Review>(r => r.AssignmentId);
    }
}
