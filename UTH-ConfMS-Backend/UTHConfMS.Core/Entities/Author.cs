namespace UTHConfMS.Core.Entities
{
    public class Author
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
    }
}
