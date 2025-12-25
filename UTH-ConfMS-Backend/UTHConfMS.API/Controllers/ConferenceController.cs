using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UTHConfMS.Core.Entities;
using UTHConfMS.Core.Interfaces;

namespace UTHConfMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConferenceController : ControllerBase
    {
        private readonly IConferenceService _service;

        public ConferenceController(IConferenceService service)
        {
            _service = service;
        }

        // lấy
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Conference>>> GetConferences()
        {
            var list = await _service.GetAllConferencesAsync();
            return Ok(list);
        }
    
        [HttpGet("{id}")]
        public async Task<ActionResult<Conference>> GetConference(int id)
        {
            var conference = await _service.GetConferenceByIdAsync(id);
            if (conference == null)
            {
                return NotFound();
            }
            return Ok(conference);
        }
        
        // thêm
        [HttpPost]
        public async Task<ActionResult<Conference>> CreateConference(Conference conference)
        {
            var (isSuccess, errorMessage, data) = await _service.CreateConferenceAsync(conference);
            if (!isSuccess)
            {
                return BadRequest(errorMessage);
            }
            if (data == null)
            {
                return BadRequest("Failed to create conference.");
            }
            return CreatedAtAction(nameof(GetConferences), new { id = data.Id }, data);
        }

        // sửa
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateConference(int id, Conference conference)
        {
            var result = await _service.UpdateConferenceAsync(id, conference);

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return NoContent();
        }

        // xóa
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConference(int id)
        {
            var result = await _service.DeleteConferenceAsync(id);

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return NoContent(); // thành công, trả về 204 (No Content)
        }
    }
}