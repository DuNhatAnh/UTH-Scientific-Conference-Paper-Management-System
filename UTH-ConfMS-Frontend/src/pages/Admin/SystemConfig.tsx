import React, { useState } from 'react';
import { ViewState } from '../../App';

interface SystemConfigProps {
  onNavigate: (view: ViewState) => void;
}

export const SystemConfig: React.FC<SystemConfigProps> = ({ onNavigate }) => {
  const [emailConfigs, setEmailConfigs] = useState([
    { id: 1, title: 'Email xác nhận nộp bài', desc: 'Gửi ngay sau khi tác giả hoàn tất nộp bài', enabled: true },
    { id: 2, title: 'Email nhắc nhở phản biện', desc: 'Gửi 3 ngày trước khi hết hạn review', enabled: true },
    { id: 3, title: 'Thông báo kết quả', desc: 'Gửi khi Chair phê duyệt quyết định cuối cùng', enabled: false }
  ]);

  const handleToggleEmail = (id: number) => {
    setEmailConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, enabled: !config.enabled } : config
    ));
  };

  return (
    <div className="w-full bg-[#f8f9fc] dark:bg-background-dark py-12 px-5 md:px-10 flex justify-center min-h-screen">
      <div className="w-full max-w-[900px] flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('admin-dashboard')}
            className="w-10 h-10 rounded-full bg-white dark:bg-card-dark border border-[#eaecf0] dark:border-border-dark flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[#667085]">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-white">Cấu hình hệ thống</h1>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-[#eaecf0] dark:border-border-dark shadow-sm">
            <h2 className="text-lg font-bold text-[#101828] dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              Thời hạn quan trọng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054] dark:text-gray-300">Hạn nộp tóm tắt (Abstract)</label>
                <input type="date" defaultValue="2024-05-15" className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-background-dark" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#344054] dark:text-gray-300">Hạn nộp toàn văn (Full paper)</label>
                <input type="date" defaultValue="2024-06-01" className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-background-dark" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-[#eaecf0] dark:border-border-dark shadow-sm">
            <h2 className="text-lg font-bold text-[#101828] dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">mail</span>
              Cấu hình Email tự động
            </h2>
            <div className="space-y-4">
              {emailConfigs.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-background-dark/50 rounded-lg border border-border-light dark:border-border-dark">
                  <div>
                    <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">{item.title}</p>
                    <p className="text-xs text-[#667085]">{item.desc}</p>
                  </div>
                  <div 
                    onClick={() => handleToggleEmail(item.id)}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${item.enabled ? 'bg-primary' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.enabled ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => onNavigate('admin-dashboard')} className="px-6 py-2 bg-white dark:bg-card-dark border border-[#eaecf0] dark:border-border-dark rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">Hủy</button>
            <button 
              onClick={() => alert('Chức năng đang được phát triển!')}
              className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-hover transition-all"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};