namespace UTHConfMS.Core.Entities
{
    public class Review
    {
        public int Id { get; set; }
        public int ReviewerId { get; set; }
        public int PaperId { get; set; }
        public int Score { get; set; }
        public string Comment { get; set; } = "";
    }
}
