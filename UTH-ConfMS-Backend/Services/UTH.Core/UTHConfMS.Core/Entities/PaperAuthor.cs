using System.ComponentModel.DataAnnotations.Schema;

namespace UTHConfMS.Core.Entities
{
    [Table("paper_author")]
    public class PaperAuthor
    {
        [Column("paper_id")]
        public int PaperId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("author_order")]
        public int AuthorOrder { get; set; }

        [Column("is_corresponding")]
        public bool IsCorresponding { get; set; }

        // Navigation
        [ForeignKey("PaperId")]
        public Paper? Paper { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}