using Conference.Service.Interfaces.Repositories;

namespace Conference.Service.Interfaces;

/// <summary>
/// Unit of Work interface for managing transactions across repositories
/// </summary>
public interface IUnitOfWork : IDisposable
{
    IConferenceRepository Conferences { get; }
    ITrackRepository Tracks { get; }
    IDeadlineRepository Deadlines { get; }
    ICallForPapersRepository CallForPapers { get; }
    ICommitteeRepository CommitteeMembers { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
