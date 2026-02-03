using Microsoft.EntityFrameworkCore;
using Review.Service.Entities;

namespace Review.Service.Data;

public class ReviewDbContext : DbContext
{
    public ReviewDbContext(DbContextOptions<ReviewDbContext> options)
        : base(options) { }

    public DbSet<Assignment> Assignments { get; set; }
    public DbSet<PaperReview> Reviews { get; set; }
    public DbSet<Decision> Decisions { get; set; }
    public DbSet<Conflict> Conflicts { get; set; }
    public DbSet<Reviewer> Reviewers { get; set; }
    public DbSet<ReviewerInvitation> ReviewerInvitations { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Map Assignment entity to review_assignments table with snake_case columns
        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.ToTable("review_assignments");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SubmissionId).HasColumnName("submission_id");
            entity.Property(e => e.ReviewerId).HasColumnName("reviewer_id");
            entity.Property(e => e.AssignedBy).HasColumnName("assigned_by");
            entity.Property(e => e.AssignedAt).HasColumnName("assigned_at");
            entity.Property(e => e.Deadline).HasColumnName("deadline");
            entity.Property(e => e.Status).HasColumnName("status");
            
            // NOTE: Reviewer navigation is for convenience but NOT a formal foreign key
            // ReviewerId (Guid) stores the user UUID from Identity Service
            // The Reviewer table is a local cache with auto-increment int PK
            // Joins must manually match: Assignment.ReviewerId.ToString() == Reviewer.UserId
            entity.Ignore(a => a.Reviewer);  // Don't try to map this navigation property
        });

        modelBuilder.Entity<Reviewer>()
            .HasIndex(r => new { r.UserId, r.ConferenceId })
            .IsUnique();

        // Map PaperReview entity to reviews table with snake_case columns
        modelBuilder.Entity<PaperReview>(entity =>
        {
            entity.ToTable("reviews");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
            entity.Property(e => e.NoveltyScore).HasColumnName("novelty_score");
            entity.Property(e => e.MethodologyScore).HasColumnName("methodology_score");
            entity.Property(e => e.PresentationScore).HasColumnName("presentation_score");
            entity.Property(e => e.OverallScore).HasColumnName("overall_score");
            entity.Property(e => e.Confidence).HasColumnName("confidence");
            entity.Property(e => e.Recommendation).HasColumnName("recommendation");
            entity.Property(e => e.CommentsForAuthor).HasColumnName("comments_for_author");
            entity.Property(e => e.ConfidentialComments).HasColumnName("confidential_comments");
            entity.Property(e => e.SubmittedAt).HasColumnName("submitted_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });
    }
}
