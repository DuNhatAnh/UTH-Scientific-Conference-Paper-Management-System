
import React from 'react';
import { ViewState } from '../App';

interface FooterProps {
  onNavigate: (view: ViewState) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-border-light dark:border-border-dark bg-white dark:bg-card-dark py-12 text-sm">
      <div className="layout-container flex flex-col items-center justify-center px-5 md:px-10 lg:px-20">
        <div className="flex flex-col md:flex-row justify-between w-full max-w-[1200px] gap-8">
          <div className="flex flex-col gap-4 max-w-xs">
            <h3 className="text-lg font-bold text-primary">UTH-ConfMS</h3>
            <p className="text-text-sec-light dark:text-text-sec-dark leading-relaxed">
              Hệ thống quản lý hội nghị khoa học trực tuyến, hỗ trợ quy trình nộp bài, phản biện và xuất bản chuyên nghiệp.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-text-main-light dark:text-text-main-dark mb-2">Liên kết nhanh</h4>
            <button onClick={() => onNavigate('home')} className="text-left text-text-sec-light hover:text-primary transition-colors">Trang chủ</button>
            <button onClick={() => onNavigate('conference-details')} className="text-left text-text-sec-light hover:text-primary transition-colors">Về hội nghị</button>
            <button onClick={() => onNavigate('call-for-papers')} className="text-left text-text-sec-light hover:text-primary transition-colors">Kêu gọi bài báo</button>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-text-main-light dark:text-text-main-dark mb-2">Hỗ trợ</h4>
            <span className="text-text-sec-light">Email: support@uth.edu.vn</span>
            <span className="text-text-sec-light">Hotline: (028) 3899 xxxx</span>
            <span className="text-text-sec-light">Địa chỉ: Số 2, Đường Võ Oanh, P.25, Q.Bình Thạnh, TP.HCM</span>
          </div>
        </div>
        <div className="w-full h-px bg-border-light dark:bg-border-dark my-8"></div>
        <div className="text-center text-text-sec-light dark:text-text-sec-dark">
          &copy; {new Date().getFullYear()} UTH Conference Management System. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
