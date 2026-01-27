
import React, { useEffect, useState } from 'react';
import { ViewState } from '../../App';
import conferenceApi, { ConferenceDto } from '../../services/conferenceApi';
import { useAuth } from '../../contexts/AuthContext';
import { CallForPapers } from '../../components/CallForPapers';

interface CFPManagementProps {
    onNavigate: (view: ViewState) => void;
    conferenceId?: string;
}

export const CFPManagement: React.FC<CFPManagementProps> = ({ onNavigate, conferenceId }) => {
    const [conference, setConference] = useState<ConferenceDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

    // Form fields
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [guidelines, setGuidelines] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        fetchConferenceAndCFP();
    }, []);

    const fetchConferenceAndCFP = async () => {
        try {
            let conf: ConferenceDto | null = null;

            if (conferenceId) {
                const res = await conferenceApi.getConference(conferenceId);
                if (res.success && res.data) {
                    conf = res.data;
                }
            }

            if (!conf) {
                const confRes = await conferenceApi.getConferences();
                if (confRes.success && confRes.data && confRes.data.items.length > 0) {
                    conf = confRes.data.items[0];
                }
            }

            if (conf) {
                if (user && conf.createdBy !== user.id) {
                    alert("Bạn không có quyền quản lý hội nghị này!");
                    onNavigate('chair-dashboard');
                    return;
                }

                setConference(conf);

                try {
                    const cfpRes = await conferenceApi.getCallForPapers(conf.conferenceId);
                    if (cfpRes.success && cfpRes.data) {
                        const cfp = cfpRes.data;
                        setTitle(cfp.title || '');
                        setContent(cfp.content || '');
                        setGuidelines(cfp.submissionGuidelines || '');
                        setIsPublished(cfp.isPublished || false);
                    }
                } catch (err) {
                    console.log("CFP might not exist yet or error", err);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        if (!conference) return;

        try {
            const res = await conferenceApi.updateCallForPapers(conference.conferenceId, {
                title,
                content,
                submissionGuidelines: guidelines,
                isPublished
            });
            if (res.success) {
                alert("Lưu thành công!");
                fetchConferenceAndCFP();
            }
        } catch (error) {
            alert("Lỗi khi lưu CFP");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!conference) return <div className="p-8 text-center">Bạn chưa tạo hội nghị nào.</div>;

    return (
        <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
            <div className="w-full max-w-[1000px] flex flex-col gap-8">
                <div className="bg-white dark:bg-card-dark rounded-xl p-8 shadow-sm border border-border-light relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b">
                        <div>
                            <h1 className="text-2xl font-black text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined">description</span>
                                Thiết lập Call For Papers (CFP)
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Quản lý nội dung kêu mời nộp bài báo cho hội nghị</p>
                        </div>
                        <button
                            onClick={() => onNavigate('chair-dashboard')}
                            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-sm"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Quay lại Dashboard
                        </button>
                    </div>

                    {conference && (
                        <div className="mb-8 p-4 bg-blue-50 dark:bg-primary/5 border border-blue-100 dark:border-primary/10 rounded-lg flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <div className="text-sm">
                                <span>Đang cấu hình cho hội nghị: </span>
                                <span className="font-bold text-primary">{conference.name} ({conference.acronym})</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tiêu đề bản tin CFP</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-white/5"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Ví dụ: Mời nộp bài cho PQD2026"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nội dung giới thiệu</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all min-h-[120px] dark:bg-white/5"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    placeholder="Giới thiệu về mục đích và ý nghĩa của hội nghị..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Hướng dẫn nộp bài (Submission Guidelines)</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all min-h-[150px] dark:bg-white/5"
                                    value={guidelines}
                                    onChange={e => setGuidelines(e.target.value)}
                                    placeholder="Định dạng PDF, tối đa 10 trang, font Times New Roman..."
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4 p-6 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                            <div className="flex items-center gap-3 flex-1">
                                <input
                                    type="checkbox"
                                    id="publish"
                                    className="w-5 h-5 text-primary rounded cursor-pointer"
                                    checked={isPublished}
                                    onChange={e => setIsPublished(e.target.checked)}
                                />
                                <label htmlFor="publish" className="cursor-pointer select-none">
                                    <span className="block font-bold text-gray-800 dark:text-white">Công khai hội nghị (Publish)</span>
                                    <span className="text-xs text-gray-500">Hiển thị thông tin này cho tất cả tác giả trên trang chủ.</span>
                                </label>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                {isPublished && (
                                    <button
                                        type="button"
                                        onClick={() => onNavigate('call-for-papers')}
                                        className="flex items-center gap-2 text-primary hover:underline font-bold mr-4"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                        Mở trang công khai
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black transition-all flex-1 md:flex-none ${showPreview ? 'bg-gray-200 text-gray-800' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'}`}
                                >
                                    <span className="material-symbols-outlined">{showPreview ? 'visibility_off' : 'visibility'}</span>
                                    {showPreview ? 'Đóng xem trước' : 'Xem trước tại đây'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-white font-black bg-primary hover:bg-primary-hover shadow-md transition-all flex-1 md:flex-none ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="material-symbols-outlined">{saving ? 'sync' : 'save'}</span>
                                    {saving ? 'Đang lưu...' : 'Lưu & Cập nhật'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {showPreview && conference && (
                    <div className="mt-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-600">visibility</span>
                                BẢN XEM TRƯỚC (PREVIEW)
                            </h2>
                            <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">Giao diện tác giả sẽ nhìn thấy</span>
                        </div>
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                            <CallForPapers
                                onNavigate={(target) => {
                                    if (target === 'home' || target === 'chair-dashboard') {
                                        setShowPreview(false);
                                    }
                                }}
                                conferenceId={conference.conferenceId}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
