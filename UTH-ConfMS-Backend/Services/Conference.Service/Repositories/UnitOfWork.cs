using Conference.Service.Data;
using Conference.Service.Interfaces;
using Conference.Service.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore.Storage;

namespace Conference.Service.Repositories;

/// <summary>
/// Unit of Work implementation for managing transactions across repositories
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ConferenceDbContext _context;
    private IDbContextTransaction? _transaction;
    
    private IConferenceRepository? _conferences;
    private ITrackRepository? _tracks;
    private IDeadlineRepository? _deadlines;
    private ICallForPapersRepository? _callForPapers;

    public UnitOfWork(ConferenceDbContext context)
    {
        _context = context;
    }

    public IConferenceRepository Conferences => _conferences ??= new ConferenceRepository(_context);
    public ITrackRepository Tracks => _tracks ??= new TrackRepository(_context);
    public IDeadlineRepository Deadlines => _deadlines ??= new DeadlineRepository(_context);
    public ICallForPapersRepository CallForPapers => _callForPapers ??= new CallForPapersRepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
