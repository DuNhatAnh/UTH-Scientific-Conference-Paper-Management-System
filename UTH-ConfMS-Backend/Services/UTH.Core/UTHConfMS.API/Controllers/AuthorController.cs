using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UTHConfMS.Core.Entities;
using UTHConfMS.Infra.Data;

namespace UTHConfMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthorController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthorController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Author
        // Lấy danh sách tất cả các Tác giả
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetAuthors()
        {
            return await _context.Users
                .Where(u => u.Role == "Author")
                .ToListAsync();
        }

        // GET: api/Author/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetAuthor(int id)
        {
            var author = await _context.Users.FindAsync(id);

            if (author == null)
            {
                return NotFound();
            }

            return author;
        }

        // POST: api/Author
        // Tạo tác giả mới
        [HttpPost]
        public async Task<ActionResult<User>> CreateAuthor(User author)
        {
            // Ép Role là Author
            author.Role = "Author";

            _context.Users.Add(author);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetAuthor", new { id = author.Id }, author);
        }

        // PUT: api/Author/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAuthor(int id, User author)
        {
            if (id != author.Id)
            {
                return BadRequest();
            }

            _context.Entry(author).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AuthorExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Author/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAuthor(int id)
        {
            var author = await _context.Users.FindAsync(id);
            if (author == null)
            {
                return NotFound();
            }

            _context.Users.Remove(author);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AuthorExists(int id)
        {
            return _context.Users.Any(e => e.Id == id);
        }
    }
}