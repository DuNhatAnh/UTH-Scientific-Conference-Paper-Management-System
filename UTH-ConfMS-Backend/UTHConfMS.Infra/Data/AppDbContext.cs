using Microsoft.EntityFrameworkCore;
using UTHConfMS.Core.Entities;

namespace UTHConfMS.Infra.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) 
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Author> Authors { get; set; }
        public DbSet<Conference> Conferences { get; set; }
        public DbSet<Paper> Papers { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Conflict> Conflicts { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
        }
    }
}