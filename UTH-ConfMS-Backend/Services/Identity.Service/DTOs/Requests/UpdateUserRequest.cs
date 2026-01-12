namespace Identity.Service.DTOs.Requests;

public class UpdateUserRequest
{
    public string? FullName { get; set; }
    public string? Affiliation { get; set; }
    public string? Department { get; set; }
    public string? Title { get; set; }
    public string? Country { get; set; }
    public string? Phone { get; set; }
    public string? Orcid { get; set; }
    public string? GoogleScholarId { get; set; }
    public string? Bio { get; set; }
    public string? ProfilePictureUrl { get; set; }
}
