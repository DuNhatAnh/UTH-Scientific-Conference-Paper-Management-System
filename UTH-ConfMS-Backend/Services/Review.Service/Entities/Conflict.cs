using System.ComponentModel.DataAnnotations;

namespace Review.Service.Entities
{
    public class Conflict
    {
        [Key]
        public int Id { get; set; }
        public int PaperId { get; set; }
        public int ReviewerId { get; set; }
        public string? Reason { get; set; }
    }
}