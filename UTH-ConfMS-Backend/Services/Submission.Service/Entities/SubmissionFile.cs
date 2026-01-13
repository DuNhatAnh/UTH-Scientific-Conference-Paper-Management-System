using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Submission.Service.Entities;

[Table("submission_files")]
public class SubmissionFile
{
    [Key]
    [Column("id")]
    public Guid FileId { get; set; }

    [Column("submission_id")]
    public Guid SubmissionId { get; set; }

    [Column("file_name")]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Column("file_path")]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [Column("file_size")]
    public long FileSizeBytes { get; set; }

    [Column("file_type")]
    [MaxLength(50)]
    public string FileType { get; set; } = "PDF";

    [Column("is_main_paper")]
    public bool IsMainPaper { get; set; } = true;

    [Column("uploaded_by")]
    public Guid UploadedBy { get; set; }

    [Column("uploaded_at")]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SubmissionId")]
    public virtual Submission Submission { get; set; } = null!;
}
