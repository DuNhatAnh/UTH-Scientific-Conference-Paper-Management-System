using System;
using System.ComponentModel.DataAnnotations;

namespace UTHConfMS.Core.Entities
{
    public class Conference
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Location { get; set; } = string.Empty;
    }
}