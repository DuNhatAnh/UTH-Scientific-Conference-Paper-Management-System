using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Submission.Service.DTOs;
using Submission.Service.Interfaces;

namespace Submission.Service.Controllers
{
    [ApiController]
    [Route("api/papers")]
    [Authorize]
    public class PapersController : ControllerBase
    {
        private readonly IPaperService _paperService;

        public PapersController(IPaperService paperService)
        {
            _paperService = paperService;
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(idClaim))
                throw new Exception("Không xác định được user");

            return Guid.Parse(idClaim);
        }

        // API 1: Tạo bài báo
        [HttpPost("create")]
        public async Task<IActionResult> CreatePaper([FromBody] CreatePaperDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var paperId = await _paperService.CreatePaperAsync(dto, userId);
                return Ok(new { paperId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // API 2: Upload file
        [HttpPost("{paperId}/submit")]
        public async Task<IActionResult> SubmitPaper(Guid paperId, IFormFile pdf)
        {
            if (pdf == null || !pdf.FileName.EndsWith(".pdf"))
                return BadRequest("Chỉ chấp nhận file PDF");

            try
            {
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
                if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

                var fileName = $"paper_{paperId}_{Guid.NewGuid()}.pdf";
                var filePath = Path.Combine(uploadsDir, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await pdf.CopyToAsync(stream);
                }

                await _paperService.SubmitPaperAsync(paperId, GetUserId(), fileName);

                return Ok(new { message = "Nộp bài thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // API 3: Lấy danh sách bài
        [HttpGet("my-submissions")]
        public async Task<IActionResult> GetMyPapers()
        {
            try
            {
                var userId = GetUserId();
                var papers = await _paperService.GetMyPapersAsync(userId);
                return Ok(papers);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
