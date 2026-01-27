using Microsoft.AspNetCore.Http;

namespace Submission.Service.DTOs.Requests;

public record UpdateSubmissionRequest
{
    public Guid? TrackId { get; set; }
    public string? Title { get; set; }
    public string? Abstract { get; set; }
    public List<string>? Keywords { get; set; }
    public IFormFile? File { get; set; }
    public List<CreateAuthorRequest>? Authors { get; set; }
}
