using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UTHConfMS.Infra.Data;
using UTHConfMS.Core.Entities;

namespace UTHConfMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConferenceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ConferenceController(AppDbContext context)
        {
            _context = context;
        }

        // lấy
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Conference>>> GetConferences()
        {
            return await _context.Conferences.ToListAsync();
        }

        // thêm
        [HttpPost]
        public async Task<ActionResult<Conference>> CreateConference(Conference conference)
        {
            _context.Conferences.Add(conference);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetConferences), new { id = conference.Id }, conference);
        }

        // xoa
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConference(int id)
        {
            var conference = await _context.Conferences.FindAsync(id);
            if (conference == null)
            {
                return NotFound();
            }

            _context.Conferences.Remove(conference);
            await _context.SaveChangesAsync();

            return NoContent(); // thành công, trả về 204 (No Content)
        }

        // sửa
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateConference(int id, Conference conference)
        {
            if (id != conference.Id)
            {
                return BadRequest("ID không khớp!");
            }

            // Đánh dấu trạng thái đã sửa đổi
            _context.Entry(conference).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Conferences.Any(e => e.Id == id))
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
    }
}