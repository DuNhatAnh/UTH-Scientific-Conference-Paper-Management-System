using Microsoft.EntityFrameworkCore;
using UTHConfMS.Core.Entities;
using UTHConfMS.Core.Interfaces.Repository;
using UTHConfMS.Infra.Data;

namespace UTHConfMS.Infra.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _db;

        public UserRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<User>> GetAllAsync()
            => await _db.Users.ToListAsync();

        public async Task<User?> GetByIdAsync(int id)
            => await _db.Users.FindAsync(id);

        public async Task<User?> GetByEmailAsync(string email)
            => await _db.Users.FirstOrDefaultAsync(x => x.Email == email);

        public async Task AddAsync(User user)
        {
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }

        public async Task UpdateAsync(User user)
        {
            _db.Users.Update(user);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(User user)
        {
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }
    }
}
