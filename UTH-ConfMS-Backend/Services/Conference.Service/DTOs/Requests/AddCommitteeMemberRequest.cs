namespace Conference.Service.DTOs.Requests;

public class AddCommitteeMemberRequest
{
    public Guid UserId { get; set; }
    public string Role { get; set; } = "REVIEWER"; // CHAIR, PC_MEMBER, REVIEWER
}
