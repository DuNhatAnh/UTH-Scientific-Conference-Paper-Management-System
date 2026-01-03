using System.ComponentModel.DataAnnotations;

namespace UTHConfMS.Core.DTOs
{
    public class CreateTrackDTO
    {
        [Required]
        public int ConferenceId { get; set; } // Track này thuộc hội nghị nào?

        [Required]
        public string Name { get; set; } = string.Empty; // Tên track (VD: CNTT, Kinh tế...)

        public string? TopicKeywords { get; set; } // Từ khóa (VD: AI, IoT, Blockchain)
    }
}