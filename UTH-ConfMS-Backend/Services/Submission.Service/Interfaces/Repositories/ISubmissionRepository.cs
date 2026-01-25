using Submission.Service.Entities;
using SubmissionEntity = Submission.Service.Entities.Submission;

namespace Submission.Service.Interfaces.Repositories;

/// <summary>
/// Repository interface for Submission entity operations
/// </summary>
public interface ISubmissionRepository
{
    Task<SubmissionEntity?> GetByIdAsync(Guid submissionId);
    Task<SubmissionEntity?> GetByIdWithAuthorsAsync(Guid submissionId);
    Task<SubmissionEntity?> GetByIdWithDetailsAsync(Guid submissionId);
    Task<List<SubmissionEntity>> GetAllAsync(Guid? conferenceId, string? status, int skip, int take);
    Task<List<SubmissionEntity>> GetByUserAsync(Guid userId, Guid? conferenceId, string? status, int skip, int take, bool excludeWithdrawn = false);
    Task<List<SubmissionEntity>> GetByConferenceAsync(Guid conferenceId);
    Task<int> CountAsync(Guid? conferenceId, string? status);
    Task<int> CountByUserAsync(Guid userId, Guid? conferenceId, string? status, bool excludeWithdrawn = false);
    Task<int?> GetMaxSubmissionNumberAsync(Guid conferenceId);
    Task<SubmissionEntity> CreateAsync(SubmissionEntity submission);
    Task UpdateAsync(SubmissionEntity submission);
    Task DeleteAsync(SubmissionEntity submission);
}
