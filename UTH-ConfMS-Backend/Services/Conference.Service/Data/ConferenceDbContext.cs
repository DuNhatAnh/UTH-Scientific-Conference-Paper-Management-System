using Microsoft.EntityFrameworkCore;
using Conference.Service.Entities;
using ConferenceEntity = Conference.Service.Entities.Conference;

namespace Conference.Service.Data;

public class ConferenceDbContext : DbContext
{
    public ConferenceDbContext(DbContextOptions<ConferenceDbContext> options) : base(options)
    {
    }

    public DbSet<ConferenceEntity> Conferences { get; set; }
    public DbSet<ConferenceTrack> ConferenceTracks { get; set; }
    public DbSet<ConferenceTopic> ConferenceTopics { get; set; }
    public DbSet<ConferenceDeadline> ConferenceDeadlines { get; set; }
    public DbSet<CallForPapers> CallForPapers { get; set; }
    public DbSet<CommitteeMember> CommitteeMembers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Conference entity
        modelBuilder.Entity<ConferenceEntity>(entity =>
        {
            entity.HasKey(e => e.ConferenceId);
            entity.HasIndex(e => e.Acronym).IsUnique();
            entity.HasIndex(e => new { e.Status, e.Visibility });
            entity.HasIndex(e => new { e.StartDate, e.EndDate });
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // ConferenceTrack entity
        modelBuilder.Entity<ConferenceTrack>(entity =>
        {
            entity.HasKey(e => e.TrackId);
            entity.HasIndex(e => new { e.ConferenceId, e.Name });

            entity.HasOne(e => e.Conference)
                  .WithMany(c => c.Tracks)
                  .HasForeignKey(e => e.ConferenceId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // ConferenceTopic entity
        modelBuilder.Entity<ConferenceTopic>(entity =>
        {
            entity.HasKey(e => e.TopicId);
            entity.HasIndex(e => new { e.ConferenceId, e.Name });

            entity.HasOne(e => e.Conference)
                  .WithMany(c => c.Topics)
                  .HasForeignKey(e => e.ConferenceId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // ConferenceDeadline entity
        modelBuilder.Entity<ConferenceDeadline>(entity =>
        {
            entity.HasKey(e => e.DeadlineId);
            entity.HasIndex(e => new { e.ConferenceId, e.DeadlineType });
            entity.HasIndex(e => e.DeadlineDate);

            entity.HasOne(e => e.Conference)
                  .WithMany(c => c.Deadlines)
                  .HasForeignKey(e => e.ConferenceId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // CallForPapers entity
        modelBuilder.Entity<CallForPapers>(entity =>
        {
            entity.HasKey(e => e.CfpId);
            entity.HasIndex(e => e.ConferenceId).IsUnique();

            entity.HasOne(e => e.Conference)
                  .WithOne(c => c.CallForPapers)
                  .HasForeignKey<CallForPapers>(e => e.ConferenceId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // CommitteeMember entity
        modelBuilder.Entity<CommitteeMember>(entity =>
        {
            entity.HasKey(e => e.MemberId);
            entity.HasIndex(e => new { e.ConferenceId, e.UserId, e.Role }).IsUnique();

            entity.HasOne(e => e.Conference)
                  .WithMany() // Assuming Conference doesn't strongly track members in navigation or add collection if needed
                  .HasForeignKey(e => e.ConferenceId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });
    }
}
