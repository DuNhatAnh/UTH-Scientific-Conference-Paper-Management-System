
import React from 'react';
import { ViewState } from '../App';

interface CallForPapersProps {
    onNavigate: (view: ViewState) => void;
}

export const CallForPapers: React.FC<CallForPapersProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-12 px-5 md:px-10 flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-8">
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-10 text-white shadow-lg">
            <h1 className="text-3xl font-bold mb-4">Kêu Gọi Viết Bài (Call for Papers)</h1>
            <p className="text-lg opacity-90 mb-6">Chúng tôi trân trọng kính mời quý thầy cô, các nhà khoa học và nghiên cứu sinh gửi bài tham dự ICSSE 2024.</p>
            <button onClick={() => onNavigate('login')} className="bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-md">
                Nộp bài ngay
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm">
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">topic</span> Chủ đề Hội nghị
                </h2>
                <ul className="space-y-3">
                    <li className="flex gap-2"><span className="text-primary">•</span> Artificial Intelligence & Big Data</li>
                    <li className="flex gap-2"><span className="text-primary">•</span> Intelligent Control Systems</li>
                    <li className="flex gap-2"><span className="text-primary">•</span> Renewable Energy & Smart Grid</li>
                    <li className="flex gap-2"><span className="text-primary">•</span> IoT & Communication Systems</li>
                    <li className="flex gap-2"><span className="text-primary">•</span> Robotics & Automation</li>
                </ul>
            </div>

            <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm">
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">description</span> Quy định Bài báo
                </h2>
                <ul className="space-y-3 text-sm">
                    <li>- Bài báo phải được viết bằng tiếng Anh.</li>
                    <li>- Độ dài từ 4-6 trang theo mẫu IEEE Conference Template.</li>
                    <li>- Định dạng file: PDF.</li>
                    <li>- Chưa từng được xuất bản tại các hội nghị/tạp chí khác.</li>
                </ul>
                <div className="mt-6">
                    <button className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">download</span> Tải mẫu bài báo (Word/LaTex)
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
