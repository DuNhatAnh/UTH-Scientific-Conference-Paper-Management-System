using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTHConfMS.Core.DTOs;
using UTHConfMS.Core.Interfaces;

namespace UTHConfMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrackController : ControllerBase
    {
        private readonly ITrackService _trackService;

        public TrackController(ITrackService trackService)
        {
            _trackService = trackService;
        }

        // Lấy danh sách Track của 1 hội nghị
        [HttpGet("conference/{confId}")]
        public async Task<IActionResult> GetTracks(int confId)
        {
            var tracks = await _trackService.GetTracksByConferenceIdAsync(confId);
            return Ok(tracks);
        }

        // Tạo Track mới
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateTrack(CreateTrackDTO dto)
        {
            var result = await _trackService.CreateTrackAsync(dto);
            if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
            return Ok(new { message = "Tạo Track thành công!", track = result.Track });
        }
    }
}