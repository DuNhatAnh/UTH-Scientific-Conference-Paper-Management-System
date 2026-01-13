import React from 'react';
import { ViewState } from '../../App';

interface AdminDashboardProps {
  onNavigate: (view: ViewState) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center min-h-screen">
      <div className="w-full max-w-[1200px] flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Quản lý người dùng */}
          <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm flex flex-col">
            <span className="material-symbols-outlined text-4xl text-primary mb-2">manage_accounts</span>
            <h3 className="font-bold text-lg">Quản lý người dùng</h3>
            <p className="text-sm text-text-sec-light mt-1">Thêm, sửa, xóa và phân quyền người dùng (Author, Reviewer, Chair).</p>
            <button 
              onClick={() => onNavigate('admin-users')}
              className="mt-auto pt-4 text-sm font-bold text-primary hover:underline text-left flex items-center gap-1"
            >
              Truy cập <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Card 2: Cấu hình hệ thống */}
          <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm flex flex-col">
            <span className="material-symbols-outlined text-4xl text-green-600 mb-2">settings_applications</span>
            <h3 className="font-bold text-lg">Cấu hình hệ thống</h3>
            <p className="text-sm text-text-sec-light mt-1">Cài đặt hạn nộp bài, email tự động, giao diện hội nghị.</p>
            <button 
              
              className="mt-auto pt-4 text-sm font-bold text-primary hover:underline text-left flex items-center gap-1"
            >
              Truy cập <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Card 3: Sao lưu & Dữ liệu */}
          <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm flex flex-col">
            <span className="material-symbols-outlined text-4xl text-blue-600 mb-2">database</span>
            <h3 className="font-bold text-lg">Sao lưu & Dữ liệu</h3>
            <p className="text-sm text-text-sec-light mt-1">Quản lý cơ sở dữ liệu, lịch sử hoạt động và logs hệ thống.</p>
            <button 
              
              className="mt-auto pt-4 text-sm font-bold text-primary hover:underline text-left flex items-center gap-1"
            >
              Truy cập <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs font-bold text-primary uppercase">Tổng User</p>
            <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">1,240</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs font-bold text-green-600 uppercase">Online</p>
            <p className="text-2xl font-black text-green-600">42</p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs font-bold text-yellow-600 uppercase">Reviewer mới</p>
            <p className="text-2xl font-black text-yellow-600">8</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs font-bold text-red-600 uppercase">Báo cáo lỗi</p>
            <p className="text-2xl font-black text-red-600">3</p>
          </div>
        </div>
      </div>
    </div>
  );
};