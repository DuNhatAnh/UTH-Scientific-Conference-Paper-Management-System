using System.ComponentModel.DataAnnotations;

namespace UTHConfMS.Core.DTOs
{
    public class CreateConferenceDTO
    {
        [Required(ErrorMessage = "Tên hội nghị không được để trống")]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? TopicKeywords { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public bool AiEnabled { get; set; }
    }
}