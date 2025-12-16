
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <div>Please login</div>;

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-12 px-5 flex justify-center">
        <div className="w-full max-w-[800px] bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm p-8">
            <h1 className="text-2xl font-bold mb-6">Hồ sơ cá nhân</h1>
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <button className="text-sm text-primary hover:underline">Thay đổi ảnh đại diện</button>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-text-sec-light">Họ và tên</label>
                        <input type="text" defaultValue={user.name} className="w-full p-2 border border-border-light rounded bg-gray-50" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-text-sec-light">Email</label>
                        <input type="email" defaultValue={user.email} disabled className="w-full p-2 border border-border-light rounded bg-gray-200 cursor-not-allowed" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-text-sec-light">Đơn vị công tác (Affiliation)</label>
                        <input type="text" defaultValue="Trường ĐH Giao thông vận tải TP.HCM" className="w-full p-2 border border-border-light rounded bg-gray-50" />
                    </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-text-sec-light">Vai trò hệ thống</label>
                        <span className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-800 font-bold text-xs w-fit uppercase">{user.role}</span>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button className="px-6 py-2 bg-primary text-white font-bold rounded hover:bg-primary-hover">Lưu thay đổi</button>
                        <button className="px-6 py-2 border border-border-light rounded hover:bg-gray-50">Đổi mật khẩu</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
