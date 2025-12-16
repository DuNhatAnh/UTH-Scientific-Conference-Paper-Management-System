
import React, { useState } from 'react';
import { ViewState } from '../../App';
import { AIBadge } from '../../components/AIBadge';

interface SubmitProps {
    onNavigate: (view: ViewState) => void;
}

export const SubmitPaper: React.FC<SubmitProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-12 px-5 md:px-10 flex justify-center">
        <div className="w-full max-w-[800px] flex flex-col gap-8">
            <h1 className="text-2xl font-bold text-center text-primary">Nộp Bài Báo Mới</h1>
            
            {/* Stepper */}
            <div className="flex items-center justify-between w-full px-10">
                <div className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                    <span className="text-xs font-medium">Thông tin</span>
                </div>
                <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                    <span className="text-xs font-medium">Tác giả</span>
                </div>
                <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                    <span className="text-xs font-medium">Tập tin</span>
                </div>
            </div>

            {/* Form Content */}
            <div className="bg-white dark:bg-card-dark p-8 rounded-xl border border-border-light shadow-sm">
                {step === 1 && (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Tiêu đề bài báo <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" placeholder="Nhập tiêu đề đầy đủ..." />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Tóm tắt (Abstract) <span className="text-red-500">*</span></label>
                            <textarea className="w-full h-32 p-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="Tối đa 300 từ..."></textarea>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Từ khóa (Keywords)</label>
                            <input type="text" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" placeholder="Ví dụ: AI, IoT, Smart City (ngăn cách bởi dấu phẩy)" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Chủ đề (Track) <span className="text-red-500">*</span></label>
                            <select className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none bg-white">
                                <option>Chọn chủ đề phù hợp...</option>
                                <option>Hệ thống điều khiển thông minh</option>
                                <option>Trí tuệ nhân tạo và Ứng dụng</option>
                                <option>Hệ thống năng lượng tái tạo</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col gap-5">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-2">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <p className="text-sm text-blue-800">Tác giả đầu tiên sẽ được mặc định là tác giả liên hệ (Corresponding Author).</p>
                        </div>
                        <div className="border border-border-light rounded-lg p-4">
                            <h3 className="font-bold text-sm mb-3">Tác giả 1 (Bạn)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" value="Nguyễn Văn A" disabled className="bg-gray-100 px-3 py-2 rounded text-sm border border-border-light" />
                                <input type="text" value="nguyenvana@email.com" disabled className="bg-gray-100 px-3 py-2 rounded text-sm border border-border-light" />
                                <input type="text" placeholder="Đơn vị công tác (Affiliation)" className="col-span-2 px-3 py-2 rounded text-sm border border-border-light" />
                            </div>
                        </div>
                        <button className="flex items-center justify-center gap-2 border border-dashed border-primary text-primary py-3 rounded-lg hover:bg-blue-50 font-medium text-sm">
                            <span className="material-symbols-outlined">add</span> Thêm tác giả
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                             <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-purple-600">psychology</span>
                                <div>
                                    <h4 className="font-bold text-sm text-purple-800 dark:text-purple-300">AI Plagiarism Check</h4>
                                    <p className="text-xs text-purple-700 dark:text-purple-400">Hệ thống sẽ tự động quét trùng lặp sau khi tải lên.</p>
                                </div>
                             </div>
                             <AIBadge label="Powered" size="sm" />
                        </div>

                         <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <span className="material-symbols-outlined text-[48px] text-gray-400 mb-2">cloud_upload</span>
                            <p className="font-medium">Kéo thả file PDF vào đây hoặc <span className="text-primary underline">chọn file</span></p>
                            <p className="text-xs text-text-sec-light mt-2">Định dạng PDF, tối đa 10MB.</p>
                         </div>
                         <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="confirm" className="rounded text-primary focus:ring-primary" />
                            <label htmlFor="confirm" className="text-sm text-text-sec-light">Tôi cam kết bài báo này chưa từng được xuất bản ở bất kỳ đâu.</label>
                         </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-8 pt-6 border-t border-border-light">
                    {step > 1 ? (
                        <button onClick={() => setStep(step - 1)} className="px-6 py-2 rounded border border-border-light hover:bg-gray-100 font-medium text-sm">Quay lại</button>
                    ) : (
                        <button onClick={() => onNavigate('author-dashboard')} className="px-6 py-2 rounded text-text-sec-light hover:text-red-500 font-medium text-sm">Hủy bỏ</button>
                    )}
                    
                    {step < 3 ? (
                        <button onClick={() => setStep(step + 1)} className="px-6 py-2 rounded bg-primary text-white hover:bg-primary-hover font-medium text-sm shadow-sm">Tiếp tục</button>
                    ) : (
                        <button onClick={() => {alert('Nộp bài thành công!'); onNavigate('author-dashboard')}} className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-bold text-sm shadow-md flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">check</span> Hoàn tất nộp bài
                        </button>
                    )}
                </div>
            </div>

        </div>
    </div>
  );
};
