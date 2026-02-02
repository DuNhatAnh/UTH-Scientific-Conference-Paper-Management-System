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
        submissionDeadline: '',
        tracks: []
    });

    const [newTrack, setNewTrack] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleAddTrack = (e: React.MouseEvent) => {
        e.preventDefault();
        if (newTrack.trim()) {
            if (formData.tracks.includes(newTrack.trim())) {
                setError('Track này đã tồn tại.');
                return;
            }
            setFormData({
                ...formData,
                tracks: [...formData.tracks, newTrack.trim()]
            });
            setNewTrack('');
        }
    };

    const handleRemoveTrack = (trackName: string) => {
        setFormData({
            ...formData,
            tracks: formData.tracks.filter(t => t !== trackName)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (!formData.name || !formData.acronym) {
                throw new Error('Vui lòng điền tên hội nghị và tên viết tắt.');
            }

            if (formData.tracks.length === 0) {
                throw new Error('Vui lòng thêm ít nhất một Track (Chủ đề).');
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
                onNavigate('chair-dashboard');
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tạo hội nghị.');
            }
        } catch (err: any) {
            console.error("Create Conference Error:", err);
            let msg = 'Có lỗi xảy ra khi tạo hội nghị.';
            if (err.response && err.response.data) {
                const data = err.response.data;
                if (typeof data === 'string') msg = data;
                else if (data.message) msg = data.message;
                else if (data.errors) {
                    const firstKey = Object.keys(data.errors)[0];
                    msg = firstKey ? `${firstKey}: ${data.errors[firstKey][0]}` : (data.title || 'Dữ liệu không hợp lệ');
                } else if (data.title) msg = data.title;
            } else if (err.message) msg = err.message;
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-background-light dark:bg-background-dark py-12 px-5 md:px-10 flex justify-center">
            <div className="w-full max-w-[850px] flex flex-col gap-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate('chair-dashboard')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">Tạo Hội Nghị Mới</h1>
                </div>

                {/* Form Container */}
                <div className="bg-white dark:bg-card-dark p-10 rounded-2xl border border-border-light shadow-xl">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                        {error && (
                            <div className="p-4 text-sm text-red-600 bg-red-100 rounded-xl border border-red-200 animate-shake">
                                {error}
                            </div>
                        )}

                        {/* Basic Information Section */}
                        <div className="flex flex-col gap-6">
                            <div className="text-center mb-2">
                                <h2 className="text-xl font-bold text-primary">Cấu hình thông tin cơ bản</h2>
                                <p className="text-sm text-gray-500">Vui lòng nhập các thông tin định danh cho hội nghị</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold ml-1">Tên hội nghị <span className="text-red-500">*</span></label>
                                    <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full h-11 px-4 rounded-xl border border-border-light focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all" placeholder="VD: International Conference on AI 2026" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold ml-1">Tên viết tắt (Acronym) <span className="text-red-500">*</span></label>
                                    <input name="acronym" value={formData.acronym} onChange={handleChange} type="text" className="w-full h-11 px-4 rounded-xl border border-border-light focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all" placeholder="VD: ICAI2026" required />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold ml-1">Mô tả</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} className="w-full h-28 p-4 rounded-xl border border-border-light focus:ring-2 focus:ring-primary outline-none resize-none shadow-sm transition-all" placeholder="Mô tả ngắn gọn về hội nghị..."></textarea>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold ml-1">Địa điểm tổ chức</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-3 text-gray-400 text-[22px]">location_on</span>
                                    <input name="location" value={formData.location} onChange={handleChange} type="text" className="w-full h-11 pl-12 pr-4 rounded-xl border border-border-light focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all" placeholder="VD: Ho Chi Minh City, Vietnam" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold ml-1">Ngày bắt đầu <span className="text-red-500">*</span></label>
                                    <input name="startDate" value={formData.startDate} onChange={handleChange} type="datetime-local" className="w-full h-11 px-4 rounded-xl border border-border-light focus:ring-2 focus:ring-primary outline-none shadow-sm" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold ml-1">Ngày kết thúc <span className="text-red-500">*</span></label>
                                    <input name="endDate" value={formData.endDate} onChange={handleChange} type="datetime-local" className="w-full h-11 px-4 rounded-xl border border-border-light focus:ring-2 focus:ring-primary outline-none shadow-sm" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold ml-1">Hạn nộp bài <span className="text-red-500">*</span></label>
                                    <input name="submissionDeadline" value={formData.submissionDeadline} onChange={handleChange} type="datetime-local" className="w-full h-11 px-4 rounded-xl border border-border-light focus:ring-2 focus:ring-primary outline-none shadow-sm" required />
                                </div>
                            </div>
                        </div>

                        {/* Track Management Section */}
                        <div className="pt-8 border-t border-border-light flex flex-col gap-6">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">Quản lý Track/Chủ đề</h3>
                                <p className="text-sm text-gray-500">Thêm các track cho hội nghị để tác giả có thể chọn khi nộp bài.</p>
                            </div>

                            <div className="flex gap-4">
                                <input 
                                    value={newTrack}
                                    onChange={(e) => setNewTrack(e.target.value)}
                                    type="text" 
                                    className="flex-1 h-11 px-4 rounded-xl border border-border-light focus:ring-2 focus:ring-primary outline-none shadow-sm" 
                                    placeholder="Nhập tên track (VD: AI và Machine Learning)"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTrack(e as any))}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTrack}
                                    className="px-6 h-11 rounded-xl bg-primary text-white font-bold text-sm shadow-lg hover:bg-primary-hover active:scale-95 flex items-center gap-2 whitespace-nowrap transition-all"
                                >
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                    Thêm Track
                                </button>
                            </div>

                            {/* Vertically Listed Tracks: Compact & Clean as requested */}
                            {formData.tracks.length > 0 && (
                                <div className="flex flex-col gap-2.5">
                                    {formData.tracks.map((track, index) => (
                                        <div key={index} className="group flex items-center justify-between p-3 px-5 bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-xl shadow-sm hover:border-blue-300 transition-all animate-slide-in">
                                            <div className="flex items-center gap-4">
                                                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-primary dark:text-blue-400 font-bold text-xs border border-blue-100 dark:border-blue-900/50">
                                                    {index + 1}
                                                </div>
                                                <span className="font-semibold text-text-main-light dark:text-text-main-dark text-sm">{track}</span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveTrack(track)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500/70 hover:text-red-600 transition-all opacity-80 hover:opacity-100"
                                                title="Xóa track"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-8 border-t border-border-light flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => onNavigate('chair-dashboard')}
                                className="px-8 py-3 rounded-xl border border-border-light hover:bg-gray-100 font-bold text-sm transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`px-10 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-xl flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover active:scale-95 transition-all'}`}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Đang tạo hội nghị...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                        Tạo hội nghị ngay
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