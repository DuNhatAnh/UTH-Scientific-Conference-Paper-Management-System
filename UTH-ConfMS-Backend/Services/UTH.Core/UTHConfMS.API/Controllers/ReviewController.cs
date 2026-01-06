using Microsoft.AspNetCore.Mvc;
using UTHConfMS.Core.DTOs;
using UTHConfMS.Core.Interfaces;

namespace UTHConfMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] SubmitReviewDTO dto)
        {
            try 
            {
                var result = await _reviewService.SubmitReviewAsync(dto);
                return Ok(result);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("assigned/{reviewerId}")]
        public async Task<IActionResult> GetAssignedPapers(int reviewerId)
        {
            var result = await _reviewService.GetMyAssignedPapersAsync(reviewerId);
            return Ok(result);
        }

        [HttpGet("paper/{paperId}")]
        public async Task<IActionResult> GetReviews(int paperId)
        {
            var result = await _reviewService.GetReviewsByPaperIdAsync(paperId);
            return Ok(result);
        }
    }
}