namespace UTHConfMS.Core.Entities
{
    public class Paper
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Abstract { get; set; } = "";
        public int AuthorId { get; set; }
    }
}
