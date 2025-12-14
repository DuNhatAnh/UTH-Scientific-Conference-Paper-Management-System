using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UTHConfMS.Infra.Data;
using UTHConfMS.Core.Entities;

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
        [HttpGet]
        public async Task<IActionResult> GetAuthors()
        {
            return Ok(await _context.Authors.ToListAsync());
        }

        // GET: api/Author/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAuthor(int id)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null)
                return NotFound();

            return Ok(author);
        }

        // POST: api/Author
        [HttpPost]
        public async Task<IActionResult> CreateAuthor(Author author)
        {
            _context.Authors.Add(author);
            await _context.SaveChangesAsync();
            return Ok(author);
        }

        // PUT: api/Author/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAuthor(int id, Author author)
        {
            if (id != author.Id)
                return BadRequest();

            _context.Entry(author).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Author/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAuthor(int id)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null)
                return NotFound();

            _context.Authors.Remove(author);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
