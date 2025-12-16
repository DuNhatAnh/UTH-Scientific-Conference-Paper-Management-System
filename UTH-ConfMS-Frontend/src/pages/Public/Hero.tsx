
import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-background-dark">
      <div className="flex flex-1 justify-center px-5 md:px-10 lg:px-20 py-12 lg:py-20">
        <div className="layout-content-container flex flex-col max-w-[1200px] flex-1">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex flex-col gap-6 flex-1 lg:max-w-[55%]">
              <div className="flex flex-col gap-4 text-left">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary text-xs font-bold tracking-wider w-fit mb-2">
                  HỆ THỐNG QUẢN LÝ HỘI NGHỊ KHOA HỌC
                </span>
                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-text-main-light dark:text-text-main-dark lg:text-5xl">
                  Kết nối Tri thức - Thúc đẩy Đổi mới Sáng tạo
                </h1>
                <h2 className="text-base font-normal leading-relaxed text-text-sec-light dark:text-text-sec-dark lg:text-lg">
                  Chào mừng đến với UTH-ConfMS. Nền tảng toàn diện hỗ trợ nộp bài, phản biện và tổ chức hội nghị khoa học quốc tế một cách chuyên nghiệp và hiệu quả.
                </h2>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <button className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary hover:bg-primary-hover text-white text-base font-bold leading-normal tracking-[0.015em] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                  <span className="truncate">Nộp bài</span>
                </button>
                <button className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-6 bg-white dark:bg-card-dark text-text-main-light dark:text-text-main-dark border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700 text-base font-bold leading-normal tracking-[0.015em] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">campaign</span>
                  <span className="truncate">Xem kêu gọi bài báo</span>
                </button>
              </div>
              <div className="mt-8 p-6 rounded-xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm">
                <h3 className="text-sm font-bold text-text-sec-light dark:text-text-sec-dark uppercase tracking-wider mb-4">Thông tin hội nghị sắp tới</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-text-sec-light dark:text-text-sec-dark">Tên hội nghị</span>
                    <p className="font-bold text-primary">ICSSE 2024</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-text-sec-light dark:text-text-sec-dark">Thời gian</span>
                    <p className="font-medium text-text-main-light dark:text-text-main-dark">15 - 17 Tháng 7, 2024</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-text-sec-light dark:text-text-sec-dark">Chủ đề chính</span>
                    <p className="font-medium text-text-main-light dark:text-text-main-dark">Công nghệ Thông minh &amp; Phát triển Bền vững</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full flex-1 lg:h-auto">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-card-dark">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                <div 
                  className="w-full h-full bg-center bg-no-repeat bg-cover transform hover:scale-105 transition-transform duration-700" 
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBRnu-R22HjP8mJqC_Btj7Up0bocvokeUQ59NX36qkH5cKDgB4dkhWDJU_t8qY_UV5QDnQs83eQqOZ-_aODA8W-VoF_z8W8FzgPHUho7pEP8X42AcTLVP2D-_vgFVnh5PHEDsr0l3VPEdMAkwxnj8S4ldmB9qXtUCKC3s3BLbVVt8z8SbXHojRJN4mSXSmzdbjnoHv9CI312tx1hse4WFxAzgwDqFbIvlUJpl5q1kSMcUQv_UEBMPnwk_ZA7E3m8V2tCIgmRU78sw")' }}
                >
                </div>
                <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
                  <p className="text-sm font-medium opacity-90">Hội thảo Khoa học Quốc tế lần thứ 5</p>
                  <p className="text-xl font-bold mt-1">International Conference on System Science and Engineering</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};