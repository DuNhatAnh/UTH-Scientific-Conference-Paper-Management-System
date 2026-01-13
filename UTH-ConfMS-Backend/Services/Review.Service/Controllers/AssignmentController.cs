using Microsoft.AspNetCore.Mvc;
using Review.Service.DTOs;
using Review.Service.Interfaces;
using System.Threading.Tasks;

namespace Review.Service.Controllers
{
    [ApiController]
    [Route("api/assignment")]
    public class AssignmentController : ControllerBase
    {
        private readonly IAssignmentService _assignmentService;

        public AssignmentController(IAssignmentService assignmentService)
        {
            _assignmentService = assignmentService;
        }

        [HttpPost]
        public async Task<IActionResult> AssignReviewer([FromBody] AssignReviewerDTO dto)
        {
            var result = await _assignmentService.AssignReviewerAsync(dto);
            if (!result)
                return BadRequest(new { message = "Reviewer already assigned or invalid." });
            
            return Ok(new { message = "Assigned successfully" });
        }

        [HttpGet("paper/{paperId}")]
        public async Task<IActionResult> GetReviewers(int paperId)
        {
            var reviewers = await _assignmentService.GetReviewersForPaperAsync(paperId);
            return Ok(reviewers);
        }
    }
}