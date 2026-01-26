using Identity.Service.Data;
using Identity.Service.Interfaces;
using Identity.Service.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore.Storage;

namespace Identity.Service.Repositories;

/// <summary>
/// Unit of Work implementation for managing transactions across repositories
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly IdentityDbContext _context;
    private IDbContextTransaction? _transaction;
    
    private IUserRepository? _users;
    private IRefreshTokenRepository? _refreshTokens;
    private IRoleRepository? _roles;

    public UnitOfWork(IdentityDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users => _users ??= new UserRepository(_context);
    public IRefreshTokenRepository RefreshTokens => _refreshTokens ??= new RefreshTokenRepository(_context);
    public IRoleRepository Roles => _roles ??= new RoleRepository(_context);
    public IUserActivityLogRepository UserActivityLogs => new UserActivityLogRepository(_context);

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
