using UTHConfMS.Core.Entities;

namespace UTHConfMS.Core.Interfaces
{
    public interface IConferenceService
    {
        // Lấy danh sách
        Task<IEnumerable<Conference>> GetAllConferencesAsync();
        
        // Lấy 1 cái
        Task<Conference?> GetConferenceByIdAsync(int id);
        
        // Thêm mới (Trả về kèm thông báo lỗi nếu có)
        Task<(bool IsSuccess, string? ErrorMessage, Conference? Data)> CreateConferenceAsync(Conference conference);
        
        // Sửa
        Task<(bool IsSuccess, string? ErrorMessage)> UpdateConferenceAsync(int id, Conference conference);
        
        // Xóa
        Task<(bool IsSuccess, string? ErrorMessage)> DeleteConferenceAsync(int id);
    }
}