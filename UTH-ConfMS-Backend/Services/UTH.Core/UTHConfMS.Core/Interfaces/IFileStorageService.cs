using Microsoft.AspNetCore.Http;

namespace UTHConfMS.Core.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string folderName);
        void DeleteFile(string filePath);
    }
}