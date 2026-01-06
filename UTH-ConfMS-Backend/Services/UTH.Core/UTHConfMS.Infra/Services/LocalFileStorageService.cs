using Microsoft.AspNetCore.Http;
using UTHConfMS.Core.Interfaces;

namespace UTHConfMS.Infra.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _webRootPath;

        // Lưu ý: Trong Program.cs cần đăng ký dịch vụ này và cấu hình thư mục wwwroot
        public LocalFileStorageService(string webRootPath) 
        {
            _webRootPath = webRootPath; 
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folderName)
        {
            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var folderPath = Path.Combine(_webRootPath, folderName);

            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var filePath = Path.Combine(folderPath, fileName);
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return Path.Combine(folderName, fileName).Replace("\\", "/");
        }

        public void DeleteFile(string filePath)
        {
            // Logic xóa file nếu cần
        }
    }
}