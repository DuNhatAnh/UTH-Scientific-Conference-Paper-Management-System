using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Submission.Service.DTOs;
using Entities = Submission.Service.Entities;

namespace Submission.Service.Interfaces
{
    public interface IPaperService
    {
        Task<Guid> CreatePaperAsync(CreatePaperDTO dto, Guid userId);
        Task SubmitPaperAsync(Guid submissionId, Guid userId, string filePath);
        Task<IEnumerable<Entities.Submission>> GetMyPapersAsync(Guid userId);
    }
}
