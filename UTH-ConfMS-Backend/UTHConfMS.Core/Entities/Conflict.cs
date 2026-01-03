namespace UTHConfMS.Core.Entities
{
    public class Conflict
    {
        public int Id { get; set; }
        public int PaperId { get; set; }
        public int ReviewerId { get; set; }
        public string ConflictType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
