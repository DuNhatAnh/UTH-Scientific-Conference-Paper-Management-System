using System.Collections.Generic;
using System.Threading.Tasks;
using Review.Service.DTOs;
using Review.Service.Entities;

namespace Review.Service.Interfaces;

public interface IReviewerService
{
    Task<ReviewerInvitation> InviteReviewerAsync(InviteReviewerDTO dto);
    Task<bool> RespondToInvitationAsync(InvitationResponseDTO dto, string? userId = null);
    Task<List<Reviewer>> GetReviewersByConferenceAsync(string conferenceId);
    Task<List<ReviewerInvitation>> GetInvitationsByConferenceAsync(string conferenceId);
    Task<List<ReviewerInvitationDto>> GetInvitationsForUserAsync(string userId);
    Task<List<ReviewableSubmissionDto>> GetReviewableSubmissionsAsync(string userId, string conferenceId);
    Task<bool> DeleteInvitationAsync(int invitationId, string userId);
}