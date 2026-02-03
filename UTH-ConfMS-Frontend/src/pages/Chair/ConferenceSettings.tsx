import React, { useState, useEffect } from 'react';
import conferenceApi, { ConferenceDetailDto, CreateConferenceRequest, TrackDto } from '../../services/conferenceApi';

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

    // Track management states
    const [tracks, setTracks] = useState<TrackDto[]>([]);
    const [newTrackName, setNewTrackName] = useState('');
    const [isAddingTrack, setIsAddingTrack] = useState(false);
    const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);

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

                    // Load tracks
                    if (data.tracks) {
                        setTracks(data.tracks);
                    }
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

    const handleAddTrack = async () => {
        if (!newTrackName.trim()) {
            alert('Vui lòng nhập tên track!');
            return;
        }

        setIsAddingTrack(true);
        try {
            const response = await conferenceApi.createTrack(conferenceId, newTrackName.trim());
            if (response.success && response.data) {
                setTracks([...tracks, response.data]);
                setNewTrackName('');
                alert('Tạo track thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi tạo track.');
            }
        } catch (err: any) {
            console.error("Create Track Error:", err);
            alert(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo track.');
        } finally {
            setIsAddingTrack(false);
        }
    };

    const handleDeleteTrack = async (trackId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa track này? Các bài báo đã chọn track này sẽ không còn track.')) {
            return;
        }

        setDeletingTrackId(trackId);
        try {
            const response = await conferenceApi.deleteTrack(conferenceId, trackId);
            if (response.success) {
                setTracks(tracks.filter(t => t.trackId !== trackId));
                alert('Xóa track thành công!');
            } else {
                alert(response.message || 'Có lỗi xảy ra khi xóa track.');
            }
        } catch (err: any) {
            console.error("Delete Track Error:", err);
            alert(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xóa track.');
        } finally {
            setDeletingTrackId(null);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải cấu hình...</div>;

    return (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            {/* Thông tin cơ bản */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1 text-center">
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

            {/* Quản lý Track */}
            <div className="flex flex-col gap-6 border-t border-gray-200 pt-8">
                <div className="flex flex-col gap-1 text-center">
                    <h3 className="text-lg font-bold text-gray-800">Quản lý Track/Chủ đề</h3>
                    <p className="text-sm text-gray-500">Thêm các track cho hội nghị để tác giả có thể chọn khi nộp bài.</p>
                </div>

                <div className="max-w-2xl">
                    {/* Add Track Form */}
                    <div className="flex gap-3 mb-4">
                        <input
                            type="text"
                            value={newTrackName}
                            onChange={(e) => setNewTrackName(e.target.value)}
                            placeholder="Nhập tên track (VD: AI và Machine Learning)"
                            className="flex-1 h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTrack();
                                }
                            }}
                        />
                        <button
                            onClick={handleAddTrack}
                            disabled={isAddingTrack}
                            className={`px-5 py-2 rounded bg-primary text-white font-bold text-sm shadow-md flex items-center gap-2 ${isAddingTrack ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            {isAddingTrack ? 'Đang thêm...' : 'Thêm Track'}
                        </button>
                    </div>

                    {/* Tracks List */}
                    {tracks.length === 0 ? (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500 text-sm">
                            Chưa có track nào. Hãy thêm track đầu tiên!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {tracks.map((track, index) => (
                                <div
                                    key={track.trackId}
                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-primary transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-gray-800">{track.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteTrack(track.trackId)}
                                        disabled={deletingTrackId === track.trackId}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${deletingTrackId === track.trackId
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'text-red-600 hover:bg-red-50'
                                            }`}
                                        title="Xóa track"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {deletingTrackId === track.trackId ? 'sync' : 'delete'}
                                        </span>
                                        {deletingTrackId === track.trackId ? 'Đang xóa...' : 'Xóa'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
