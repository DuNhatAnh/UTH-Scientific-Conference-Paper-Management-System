using Submission.Service.Data;
using Submission.Service.Entities;
using Submission.Service.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using SubmissionEntity = Submission.Service.Entities.Submission;

namespace Submission.Service.Repositories;

/// <summary>
/// Repository implementation for Submission entity operations
/// </summary>
public class SubmissionRepository : ISubmissionRepository
{
    private readonly SubmissionDbContext _context;

    public SubmissionRepository(SubmissionDbContext context)
    {
        _context = context;
    }

    public async Task<SubmissionEntity?> GetByIdAsync(Guid submissionId)
    {
        return await _context.Submissions.FindAsync(submissionId);
    }

    public async Task<SubmissionEntity?> GetByIdWithAuthorsAsync(Guid submissionId)
    {
        return await _context.Submissions
            .Include(s => s.Authors)
            .FirstOrDefaultAsync(s => s.Id == submissionId);
    }

    public async Task<SubmissionEntity?> GetByIdWithDetailsAsync(Guid submissionId)
    {
        return await _context.Submissions
            .Include(s => s.Authors)
            .Include(s => s.Files)
            .FirstOrDefaultAsync(s => s.Id == submissionId);
    }

    public async Task<List<SubmissionEntity>> GetAllAsync(Guid? conferenceId, string? status, int skip, int take)
    {
        var query = _context.Submissions
            .Include(s => s.Authors)
            .Include(s => s.Files)
            .AsQueryable();

        if (conferenceId.HasValue)
        {
            query = query.Where(s => s.ConferenceId == conferenceId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            if (status.Contains(','))
            {
                var statuses = status.Split(',').Select(st => st.Trim().ToUpper()).ToList();
                query = query.Where(s => statuses.Contains(s.Status));
            }
            else
            {
                query = query.Where(s => s.Status == status);
            }
        }

        return await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<SubmissionEntity>> GetByUserAsync(Guid userId, Guid? conferenceId, string? status, int skip, int take, bool excludeWithdrawn = false)
    {
        var query = _context.Submissions
            .Include(s => s.Authors)
            .Include(s => s.Files)
            .Where(s => s.SubmittedBy == userId || s.Authors.Any(a => a.UserId == userId));

        if (conferenceId.HasValue)
        {
            query = query.Where(s => s.ConferenceId == conferenceId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            if (status.Contains(','))
            {
                var statuses = status.Split(',').Select(st => st.Trim().ToUpper()).ToList();
                query = query.Where(s => statuses.Contains(s.Status));
            }
            else
            {
                query = query.Where(s => s.Status == status);
            }
        }

        // Exclude withdrawn submissions if requested
        if (excludeWithdrawn)
        {
            query = query.Where(s => s.Status != "WITHDRAWN");
        }

        return await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<SubmissionEntity>> GetByConferenceAsync(Guid conferenceId)
    {
        return await _context.Submissions
            .Include(s => s.Authors)
            .Include(s => s.Files)
            .Where(s => s.ConferenceId == conferenceId)
            .ToListAsync();
    }

    public async Task<int> CountAsync(Guid? conferenceId, string? status)
    {
        var query = _context.Submissions.AsQueryable();

        if (conferenceId.HasValue)
        {
            query = query.Where(s => s.ConferenceId == conferenceId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            if (status.Contains(','))
            {
                var statuses = status.Split(',').Select(st => st.Trim().ToUpper()).ToList();
                query = query.Where(s => statuses.Contains(s.Status));
            }
            else
            {
                query = query.Where(s => s.Status == status);
            }
        }

        return await query.CountAsync();
    }

    public async Task<int> CountByUserAsync(Guid userId, Guid? conferenceId, string? status, bool excludeWithdrawn = false)
    {
        var query = _context.Submissions
            .Include(s => s.Authors)
            .Where(s => s.SubmittedBy == userId || s.Authors.Any(a => a.UserId == userId));

        if (conferenceId.HasValue)
        {
            query = query.Where(s => s.ConferenceId == conferenceId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            if (status.Contains(','))
            {
                var statuses = status.Split(',').Select(st => st.Trim().ToUpper()).ToList();
                query = query.Where(s => statuses.Contains(s.Status));
            }
            else
            {
                query = query.Where(s => s.Status == status);
            }
        }

        // Exclude withdrawn submissions if requested
        if (excludeWithdrawn)
        {
            query = query.Where(s => s.Status != "WITHDRAWN");
        }

        return await query.CountAsync();
    }

    public async Task<int?> GetMaxSubmissionNumberAsync(Guid conferenceId)
    {
        return await _context.Submissions
            .Where(s => s.ConferenceId == conferenceId)
            .MaxAsync(s => (int?)s.PaperNumber);
    }

    public async Task<SubmissionEntity> CreateAsync(SubmissionEntity submission)
    {
        await _context.Submissions.AddAsync(submission);
        return submission;
    }

    public Task UpdateAsync(SubmissionEntity submission)
    {
        _context.Submissions.Update(submission);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(SubmissionEntity submission)
    {
        _context.Submissions.Remove(submission);
        return Task.CompletedTask;
    }
}
