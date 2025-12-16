
import React from 'react';

export const Program: React.FC = () => {
  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-12 px-5 md:px-10 flex justify-center">
      <div className="w-full max-w-[1000px]">
        <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main-dark mb-8 text-center">Chương Trình Hội Nghị (Dự kiến)</h1>
        
        <div className="space-y-6">
            <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm overflow-hidden">
                <div className="bg-primary/10 p-4 border-b border-primary/20">
                    <h2 className="text-lg font-bold text-primary">Ngày 1: 15/07/2024</h2>
                </div>
                <div className="divide-y divide-border-light">
                    <div className="p-4 flex gap-4">
                        <span className="font-mono font-bold text-text-sec-light min-w-[80px]">08:00</span>
                        <div>
                            <h3 className="font-bold">Đón tiếp đại biểu & Đăng ký</h3>
                            <p className="text-sm text-text-sec-light">Sảnh chính Hội trường A</p>
                        </div>
                    </div>
                    <div className="p-4 flex gap-4">
                        <span className="font-mono font-bold text-text-sec-light min-w-[80px]">09:00</span>
                        <div>
                            <h3 className="font-bold">Phiên khai mạc (Opening Ceremony)</h3>
                            <p className="text-sm text-text-sec-light">Hội trường A - Phát biểu của Hiệu trưởng & Ban tổ chức</p>
                        </div>
                    </div>
                    <div className="p-4 flex gap-4">
                        <span className="font-mono font-bold text-text-sec-light min-w-[80px]">10:00</span>
                        <div>
                            <h3 className="font-bold">Keynote Speech 1: AI in Future Transportation</h3>
                            <p className="text-sm text-text-sec-light">GS. John Doe - MIT</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm overflow-hidden">
                <div className="bg-primary/10 p-4 border-b border-primary/20">
                    <h2 className="text-lg font-bold text-primary">Ngày 2: 16/07/2024</h2>
                </div>
                <div className="p-6 text-center text-text-sec-light">
                    <p>Các phiên báo cáo tiểu ban (Parallel Sessions) sẽ được cập nhật chi tiết sau khi hoàn tất quy trình phản biện.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
