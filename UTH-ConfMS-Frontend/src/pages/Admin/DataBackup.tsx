
import React from 'react';
import { ViewState } from '../../App';

interface DataBackupProps {
  onNavigate: (view: ViewState) => void;
}

export const DataBackup: React.FC<DataBackupProps> = ({ onNavigate }) => {
  const handleFeatureUnderDevelopment = () => {
    alert('Chức năng đang được phát triển!');
  };

  return (
    <div className="w-full bg-[#f8f9fc] dark:bg-background-dark py-12 px-5 md:px-10 flex justify-center min-h-screen">
      <div className="w-full max-w-[1000px] flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('admin-dashboard')}
            className="w-10 h-10 rounded-full bg-white border border-[#eaecf0] flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[#667085]">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-white">Sao lưu & Dữ liệu</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Lịch sử sao lưu */}
            <div className="bg-white rounded-xl border border-[#eaecf0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#eaecf0] flex justify-between items-center">
                <h3 className="font-bold text-[#101828]">Bản sao lưu gần đây</h3>
                <button 
                  onClick={handleFeatureUnderDevelopment}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">backup</span>
                  Sao lưu ngay
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-[#eaecf0] text-xs uppercase text-[#667085] font-bold">
                  <tr>
                    <th className="p-4">Tên bản sao lưu</th>
                    <th className="p-4">Ngày tạo</th>
                    <th className="p-4">Dung lượng</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaecf0]">
                  <tr>
                    <td className="p-4 font-medium">db_backup_20240320.sql</td>
                    <td className="p-4 text-[#667085]">20/03/2024 08:30</td>
                    <td className="p-4 text-[#667085]">42.5 MB</td>
                    <td className="p-4 text-right">
                      <button onClick={handleFeatureUnderDevelopment} className="text-primary hover:underline font-bold mr-3">Tải về</button>
                      <button onClick={handleFeatureUnderDevelopment} className="text-red-600 hover:underline font-bold">Xóa</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">db_backup_20240319.sql</td>
                    <td className="p-4 text-[#667085]">19/03/2024 23:00</td>
                    <td className="p-4 text-[#667085]">41.8 MB</td>
                    <td className="p-4 text-right">
                      <button onClick={handleFeatureUnderDevelopment} className="text-primary hover:underline font-bold mr-3">Tải về</button>
                      <button onClick={handleFeatureUnderDevelopment} className="text-red-600 hover:underline font-bold">Xóa</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Logs hệ thống */}
            <div className="bg-white rounded-xl border border-[#eaecf0] shadow-sm overflow-hidden">
               <div className="p-4 border-b border-[#eaecf0]">
                  <h3 className="font-bold text-[#101828]">Nhật ký hệ thống (Logs)</h3>
               </div>
               <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto font-mono text-xs text-[#667085]">
                  <p><span className="text-green-600">[INFO]</span> 2024-03-20 10:15:22 - Admin (admin@uth.edu.vn) đã cập nhật cấu hình hệ thống.</p>
                  <p><span className="text-blue-600">[AUTH]</span> 2024-03-20 10:10:05 - User Nguyen Van A đã đăng nhập thành công.</p>
                  <p><span className="text-green-600">[INFO]</span> 2024-03-20 08:30:11 - Hệ thống tự động sao lưu dữ liệu hoàn tất.</p>
                  <p><span className="text-purple-600">[DATA]</span> 2024-03-20 07:45:30 - Tác giả đã nộp bài báo mới ID #156.</p>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Trạng thái DB */}
            <div className="bg-white p-6 rounded-xl border border-[#eaecf0] shadow-sm">
              <h3 className="font-bold text-[#101828] mb-4">Trạng thái Cơ sở dữ liệu</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#667085]">Kết nối:</span>
                  <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span> Ổn định
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#667085]">Dung lượng:</span>
                  <span className="text-sm font-bold text-[#101828]">1.2 GB / 5 GB</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[24%]"></div>
                </div>
              </div>
            </div>

            {/* Cấu hình lưu trữ */}
            <div className="bg-white p-6 rounded-xl border border-[#eaecf0] shadow-sm">
              <h3 className="font-bold text-[#101828] mb-4">Lịch sao lưu tự động</h3>
              <select 
                onChange={handleFeatureUnderDevelopment}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 outline-none"
              >
                <option>Hàng ngày (00:00)</option>
                <option>Hàng tuần (Chủ nhật)</option>
                <option>Tắt tự động</option>
              </select>
              <p className="text-xs text-[#667085] mt-3 italic">Dữ liệu sẽ được nén và mã hóa chuẩn AES-256.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};