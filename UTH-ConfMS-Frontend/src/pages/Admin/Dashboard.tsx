
import React from 'react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
        <div className="w-full max-w-[1200px] flex flex-col gap-8">
            <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">manage_accounts</span>
                    <h3 className="font-bold text-lg">Quản lý người dùng</h3>
                    <p className="text-sm text-text-sec-light mt-1">Thêm, sửa, xóa và phân quyền người dùng.</p>
                    <button className="mt-4 text-sm font-bold text-primary hover:underline">Truy cập &rarr;</button>
                </div>
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm">
                    <span className="material-symbols-outlined text-4xl text-green-600 mb-2">settings_applications</span>
                    <h3 className="font-bold text-lg">Cấu hình hệ thống</h3>
                    <p className="text-sm text-text-sec-light mt-1">Cài đặt hạn nộp bài, email tự động, giao diện.</p>
                    <button className="mt-4 text-sm font-bold text-primary hover:underline">Truy cập &rarr;</button>
                </div>
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm">
                    <span className="material-symbols-outlined text-4xl text-blue-600 mb-2">database</span>
                    <h3 className="font-bold text-lg">Sao lưu & Dữ liệu</h3>
                    <p className="text-sm text-text-sec-light mt-1">Quản lý cơ sở dữ liệu và logs hệ thống.</p>
                    <button className="mt-4 text-sm font-bold text-primary hover:underline">Truy cập &rarr;</button>
                </div>
            </div>
        </div>
    </div>
  );
};