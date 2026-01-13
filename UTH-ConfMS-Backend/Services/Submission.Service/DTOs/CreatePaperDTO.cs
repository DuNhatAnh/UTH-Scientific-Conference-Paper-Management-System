using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Submission.Service.DTOs
{
    public class CreatePaperDTO
    {
        public Guid ConferenceId { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Abstract { get; set; } = string.Empty;

        public List<string> Keywords { get; set; } = new();

        public List<AuthorDTO> Authors { get; set; } = new();
    }

    public class AuthorDTO
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Affiliation { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
        public bool IsCorresponding { get; set; }
    }
}
