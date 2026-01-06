using Microsoft.AspNetCore.Mvc;
using UTHConfMS.Core.DTOs;
using UTHConfMS.Core.Interfaces;

namespace UTHConfMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AssignmentController : ControllerBase
    {
        private readonly IAssignmentService _assignmentService;

        public AssignmentController(IAssignmentService assignmentService)
        {
            _assignmentService = assignmentService;
        }

        [HttpPost]
        public async Task<IActionResult> Assign([FromBody] AssignReviewerDTO dto)
        {
            try
            {
                var result = await _assignmentService.AssignReviewerAsync(dto);
                if (result) return Ok(new { message = "Assigned successfully" });
                return BadRequest("Reviewer already assigned.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("paper/{paperId}")]
        public async Task<IActionResult> GetReviewers(int paperId)
        {
            var result = await _assignmentService.GetReviewersForPaperAsync(paperId);
            return Ok(result);
        }
    }
}