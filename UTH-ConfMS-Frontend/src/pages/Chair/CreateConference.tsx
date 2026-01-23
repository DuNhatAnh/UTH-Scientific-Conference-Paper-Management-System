import React, { useState } from 'react';
import { ViewState } from '../../App';
import conferenceApi, { CreateConferenceRequest } from '../../services/conferenceApi';

interface CreateConferenceProps {
    onNavigate: (view: ViewState) => void;
}

export const CreateConference: React.FC<CreateConferenceProps> = ({ onNavigate }) => {
    const [formData, setFormData] = useState<CreateConferenceRequest>({
        name: '',
        acronym: '',
        description: '',
        location: '',
        startDate: '',
        endDate: '',
        submissionDeadline: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Validate cơ bản
            if (!formData.name || !formData.acronym) {
                throw new Error('Vui lòng điền tên hội nghị và tên viết tắt.');
            }

            if (!formData.startDate || !formData.endDate || !formData.submissionDeadline) {
                throw new Error('Vui lòng chọn đầy đủ thời gian (Bắt đầu, Kết thúc, Hạn nộp bài).');
            }

            if (new Date(formData.startDate) >= new Date(formData.endDate)) {
                throw new Error('Ngày kết thúc phải diễn ra sau ngày bắt đầu.');
            }

            if (new Date(formData.submissionDeadline) >= new Date(formData.startDate)) {
                throw new Error('Hạn nộp bài phải trước ngày bắt đầu hội nghị.');
            }

            const response = await conferenceApi.createConference(formData);

            if (response.success && response.data) {
                alert(`Tạo hội nghị "${response.data.name}" thành công!`);
                onNavigate('chair-dashboard'); // Quay lại dashboard sau khi tạo xong
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tạo hội nghị.');
            }
        } catch (err: any) {
            // Log chi tiết lỗi ra console để debug (F12)
            console.error("Create Conference Error:", err);

            let msg = 'Có lỗi xảy ra khi tạo hội nghị.';
            if (err.response && err.response.data) {
                const data = err.response.data;
                if (typeof data === 'string') {
                    msg = data; // Backend trả về chuỗi lỗi trực tiếp
                } else if (data.message) {
                    msg = data.message; // Backend trả về object { message: ... }
                } else if (data.errors) {
                    // Backend trả về Validation ProblemDetails (ví dụ: lỗi validate trường rỗng)
                    const firstKey = Object.keys(data.errors)[0];
                    msg = firstKey ? `${firstKey}: ${data.errors[firstKey][0]}` : (data.title || 'Dữ liệu không hợp lệ');
                } else if (data.title) {
                    msg = data.title;
                }
            } else if (err.message) {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
            <div className="w-full max-w-[800px] flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate('chair-dashboard')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">Tạo Hội Nghị Mới</h1>
                </div>

                {/* Form */}
                <div className="bg-white dark:bg-card-dark p-8 rounded-xl border border-border-light shadow-sm">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-100 rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold">Tên hội nghị <span className="text-red-500">*</span></label>
                                <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" placeholder="VD: International Conference on AI 2026" required />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold">Tên viết tắt (Acronym) <span className="text-red-500">*</span></label>
                                <input name="acronym" value={formData.acronym} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" placeholder="VD: ICAI2026" required />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Mô tả</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full h-24 p-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="Mô tả ngắn gọn về hội nghị..."></textarea>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Địa điểm tổ chức</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[20px]">location_on</span>
                                <input name="location" value={formData.location} onChange={handleChange} type="text" className="w-full h-10 pl-10 pr-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" placeholder="VD: Ho Chi Minh City, Vietnam" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold">Ngày bắt đầu <span className="text-red-500">*</span></label>
                                <input name="startDate" value={formData.startDate} onChange={handleChange} type="datetime-local" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" required />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold">Ngày kết thúc <span className="text-red-500">*</span></label>
                                <input name="endDate" value={formData.endDate} onChange={handleChange} type="datetime-local" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" required />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold">Hạn nộp bài <span className="text-red-500">*</span></label>
                                <input name="submissionDeadline" value={formData.submissionDeadline} onChange={handleChange} type="datetime-local" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" required />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border-light flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => onNavigate('chair-dashboard')}
                                className="px-5 py-2 rounded border border-border-light hover:bg-gray-100 font-medium text-sm transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`px-6 py-2 rounded bg-primary text-white font-bold text-sm shadow-md flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover'}`}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                        Tạo hội nghị
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};