using Microsoft.EntityFrameworkCore;
using Submission.Service.Entities;
using SubmissionEntity = Submission.Service.Entities.Submission;

namespace Submission.Service.Data;

public class SubmissionDbContext : DbContext
{
    public SubmissionDbContext(DbContextOptions<SubmissionDbContext> options) : base(options)
    {
    }

    public DbSet<SubmissionEntity> Submissions { get; set; }
    public DbSet<Author> Authors { get; set; }
    public DbSet<SubmissionFile> SubmissionFiles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Submission entity
        modelBuilder.Entity<SubmissionEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ConferenceId, e.PaperNumber }).IsUnique();
            entity.HasIndex(e => new { e.ConferenceId, e.Status });
            entity.HasIndex(e => e.SubmittedBy);
            entity.HasIndex(e => e.SubmittedAt);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Author entity
        modelBuilder.Entity<Author>(entity =>
        {
            entity.HasKey(e => e.AuthorId);
            entity.HasIndex(e => e.SubmissionId);
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => new { e.SubmissionId, e.AuthorOrder }).IsUnique();

            entity.HasOne(e => e.Submission)
                  .WithMany(s => s.Authors)
                  .HasForeignKey(e => e.SubmissionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // SubmissionFile entity
        modelBuilder.Entity<SubmissionFile>(entity =>
        {
            entity.HasKey(e => e.FileId);
            entity.HasIndex(e => new { e.SubmissionId, e.FileType });

            entity.HasOne(e => e.Submission)
                  .WithMany(s => s.Files)
                  .HasForeignKey(e => e.SubmissionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.UploadedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });
    }
}