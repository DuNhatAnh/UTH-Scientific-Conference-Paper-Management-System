import React, { useState, useEffect } from 'react';
import conferenceApi, { ConferenceDetailDto, CreateConferenceRequest } from '../../services/conferenceApi';

interface ConferenceSettingsProps {
    conferenceId: string;
    onUpdateSuccess?: () => void;
}

export const ConferenceSettings: React.FC<ConferenceSettingsProps> = ({ conferenceId, onUpdateSuccess }) => {
    const [formData, setFormData] = useState<Partial<CreateConferenceRequest>>({
        name: '',
        acronym: '',
        description: '',
        location: '',
        startDate: '',
        endDate: '',
        submissionDeadline: ''
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const response = await conferenceApi.getConference(conferenceId);
                if (response.success && response.data) {
                    const data = response.data;
                    setFormData({
                        name: data.name,
                        acronym: data.acronym,
                        description: data.description || '',
                        location: data.location || '',
                        startDate: data.startDate ? data.startDate.split('T')[0] : '',
                        endDate: data.endDate ? data.endDate.split('T')[0] : '',
                        submissionDeadline: data.submissionDeadline ? data.submissionDeadline.split('T')[0] : ''
                    });
                }
            } catch (err) {
                console.error("Failed to fetch conference detail", err);
                setError('Không thể tải thông tin hội nghị.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [conferenceId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const response = await conferenceApi.updateConference(conferenceId, formData);
            if (response.success) {
                alert('Cập nhật thông tin hội nghị thành công!');
                if (onUpdateSuccess) onUpdateSuccess();
            } else {
                setError(response.message || 'Có lỗi xảy ra khi cập nhật.');
            }
        } catch (err: any) {
            console.error("Update Conference Error:", err);
            setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi cập nhật.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải cấu hình...</div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-gray-800">Cấu hình thông tin cơ bản</h3>
                <p className="text-sm text-gray-500">Cập nhật tên, thời gian và hạn nộp của hội nghị.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-100 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700">Tên hội nghị</label>
                        <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700">Tên viết tắt</label>
                        <input name="acronym" value={formData.acronym} onChange={handleChange} type="text" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" required />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Mô tả</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full h-24 p-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700">Ngày bắt đầu</label>
                        <input name="startDate" value={formData.startDate} onChange={handleChange} type="date" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-700">Ngày kết thúc</label>
                        <input name="endDate" value={formData.endDate} onChange={handleChange} type="date" className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5 border-2 border-primary/20 p-1.5 rounded-lg bg-primary/5">
                        <label className="text-sm font-bold text-primary">Hạn nộp bài</label>
                        <input name="submissionDeadline" value={formData.submissionDeadline} onChange={handleChange} type="date" className="w-full h-8 px-3 rounded border border-primary/30 focus:ring-2 focus:ring-primary outline-none" required />
                    </div>
                </div>

                <div className="pt-4 border-t border-border-light flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-6 py-2 rounded bg-primary text-white font-bold text-sm shadow-md transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover hover:scale-[1.02]'}`}
                    >
                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
};
