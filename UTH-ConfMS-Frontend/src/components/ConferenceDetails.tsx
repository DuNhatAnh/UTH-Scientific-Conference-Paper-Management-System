
import React from 'react';

export const ConferenceDetails: React.FC = () => {
  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-12 px-5 md:px-10 flex justify-center">
      <div className="w-full max-w-[1000px] bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-primary mb-6">Thông Tin Hội Nghị ICSSE 2024</h1>
        
        <div className="space-y-6 text-text-main-light dark:text-text-main-dark leading-relaxed">
          <p>
            Hội nghị Quốc tế về Khoa học Hệ thống và Kỹ thuật (ICSSE) là diễn đàn khoa học uy tín thường niên, nơi quy tụ các nhà nghiên cứu, học giả và chuyên gia hàng đầu từ khắp nơi trên thế giới.
          </p>
          
          <h2 className="text-xl font-bold mt-4">Mục tiêu</h2>
          <p>
            Tạo môi trường trao đổi học thuật chất lượng cao, chia sẻ những kết quả nghiên cứu mới nhất trong các lĩnh vực Hệ thống thông minh, Điều khiển tự động, Năng lượng tái tạo và Công nghệ thông tin.
          </p>

          <h2 className="text-xl font-bold mt-4">Đơn vị tổ chức</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Trường Đại học Giao thông vận tải TP.HCM (UTH)</li>
            <li>Hội Tự động hóa Việt Nam (VAA)</li>
            <li>IEEE Vietnam Section</li>
          </ul>

          <h2 className="text-xl font-bold mt-4">Địa điểm</h2>
          <div className="aspect-video w-full bg-gray-200 rounded-lg flex items-center justify-center">
             <span className="text-gray-500">Google Maps Embed Placeholder</span>
          </div>
          <p className="italic text-sm text-center mt-2">Hội trường A, Trường ĐH Giao thông vận tải TP.HCM</p>
        </div>
      </div>
    </div>
  );
};
