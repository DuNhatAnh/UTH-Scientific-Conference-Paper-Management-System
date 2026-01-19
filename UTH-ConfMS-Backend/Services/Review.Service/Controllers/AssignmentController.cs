using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Review.Service.DTOs;
using Review.Service.Interfaces;
using System.Threading.Tasks;
using System;

namespace Review.Service.Controllers
{
    [ApiController]
    [Route("api/assignments")]
    [Authorize(Roles = "chair,admin")]
    public class AssignmentController : ControllerBase
    {
        private readonly IAssignmentService _assignmentService;

        public AssignmentController(IAssignmentService assignmentService)
        {
            _assignmentService = assignmentService;
        }

        // POST: api/assignments
        // Phân công Reviewer cho bài báo (USCPMS-43) có check COI (USCPMS-42)
        [HttpPost]
        public async Task<IActionResult> AssignReviewer([FromBody] AssignReviewerDTO dto)
        {
            try
            {
                var result = await _assignmentService.AssignReviewerAsync(dto);
                if (result)
                {
                    return Ok(new { message = "Phân công Reviewer thành công." });
                }
                return BadRequest(new { message = "Phân công thất bại hoặc đã tồn tại." });
            }
            catch (Exception ex)
            {
                // Trả về lỗi 400 kèm message để Frontend hiển thị (ví dụ: Lỗi COI)
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/assignments/paper/{paperId}
        // Lấy danh sách Reviewer và trạng thái review của một bài báo (USCPMS-44)
        [HttpGet("paper/{paperId}")]
        public async Task<IActionResult> GetReviewersForPaper(int paperId)
        {
            var result = await _assignmentService.GetReviewersForPaperAsync(paperId);
            return Ok(result);
        }

        // GET: api/assignments/available-reviewers/{paperId}
        // Lấy danh sách Reviewer chưa được phân công cho bài báo này (USCPMS-43)
        [HttpGet("available-reviewers/{paperId}")]
        public async Task<IActionResult> GetAvailableReviewers(int paperId)
        {
            var result = await _assignmentService.GetAvailableReviewersAsync(paperId);
            return Ok(result);
        }
    }
}