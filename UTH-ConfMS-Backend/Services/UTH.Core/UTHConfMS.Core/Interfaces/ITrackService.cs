using UTHConfMS.Core.DTOs;
using UTHConfMS.Core.Entities;

namespace UTHConfMS.Core.Interfaces
{
    public interface ITrackService
    {
        // Lấy danh sách Track theo ID Hội nghị (Để frontend hiện dropdown cho user chọn)
        Task<IEnumerable<Track>> GetTracksByConferenceIdAsync(int conferenceId);

        // Tạo Track mới
        Task<(bool IsSuccess, string ErrorMessage, Track? Track)> CreateTrackAsync(CreateTrackDTO dto);
    }
}