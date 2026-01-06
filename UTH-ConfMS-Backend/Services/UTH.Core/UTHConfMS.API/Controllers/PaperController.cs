using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UTHConfMS.Core.Interfaces;

namespace UTHConfMS.API.Controllers
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

        private int GetUserId()
        {
            return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        [HttpPost("{paperId}/submit")]
        public async Task<IActionResult> SubmitPaper(int paperId, IFormFile pdf)
        {
            if (pdf == null || !pdf.FileName.EndsWith(".pdf"))
                return BadRequest("Only PDF files are allowed");

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            if (!Directory.Exists(uploadsDir))
                Directory.CreateDirectory(uploadsDir);

            var fileName = $"paper_{paperId}.pdf";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await pdf.CopyToAsync(stream);
            }

            await _paperService.SubmitPaperAsync(
                paperId,
                GetUserId(),
                fileName
            );

            return Ok("Paper submitted successfully");
        }
    }
}
