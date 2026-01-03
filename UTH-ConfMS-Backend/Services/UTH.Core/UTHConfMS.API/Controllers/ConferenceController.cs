using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using UTHConfMS.Core.Entities;
using UTHConfMS.Core.DTOs;
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
            if (conference == null) return NotFound("Không tìm thấy hội nghị");
            return Ok(conference);
        }
        
        // thêm
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Conference>> CreateConferenceAsync(CreateConferenceDTO dto)
        {
           var conference = new Conference
            {
                Name = dto.Name,
                Description = dto.Description,
                TopicKeywords = dto.TopicKeywords,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                AiEnabled = dto.AiEnabled
            };

            var result = await _service.CreateConferenceAsync(conference);
            if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
            if (result.Data == null) return BadRequest(new { message = "Tạo hội nghị thất bại" });
            return CreatedAtAction(nameof(GetConference), new { id = result.Data.Id }, result.Data);
        }

        // sửa
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateConference(int id, Conference conference)
        {
            var result = await _service.UpdateConferenceAsync(id, conference);
            if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
            return NoContent();
        }

        // xóa
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConference(int id)
        {
            var result = await _service.DeleteConferenceAsync(id);
            if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
            return NoContent(); // thành công, trả về 204 (No Content)
        }
    }
}