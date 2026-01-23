
import React, { useEffect, useState } from 'react';
import { ViewState } from '../../App';
import conferenceApi, { ConferenceDto } from '../../services/conferenceApi';
import { useAuth } from '../../contexts/AuthContext';

interface CFPManagementProps {
    onNavigate: (view: ViewState) => void;
    conferenceId?: string; // Optional if passed directly, otherwise fetch from context/url (mocking url param here)
}

export const CFPManagement: React.FC<CFPManagementProps> = ({ onNavigate, conferenceId }) => {
    // In a real router, we'd get ID from params. For now, we might need to select it or prompt user.
    // Simplifying: Assume Chair manages their first active conference or select from Dashboard.
    // Better yet, modify Dashboard to pass selected conference ID to this view in App state. 
    // Since App.tsx is simple switch, we'll assume we need to select one or mock ID=1 for now if not passed.
    // Wait, Dashboard has a "Manage" button. Let's assume we pass ID via a global store or just fetch the first one for Mock.

    // REALITY CHECK: The current App structure simple ViewState string doesn't support passing params easily without Context.
    // I will stick to fetching the first conference for the logged-in user for this prototype phase, 
    // OR ideally extending ViewState to be an object, but that's a big refactor.
    // PROPOSAL: Add a simple selector if multiple conferences, or just pick the first one.

    const [conference, setConference] = useState<ConferenceDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

    // Form fields
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [guidelines, setGuidelines] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    useEffect(() => {
        fetchConferenceAndCFP();
    }, []);

    const fetchConferenceAndCFP = async () => {
        try {
            let conf: ConferenceDto | null = null;

            if (conferenceId) {
                // If ID passed, fetch specifically
                try {
                    const res = await conferenceApi.getConference(conferenceId);
                    if (res.success && res.data) {
                        conf = res.data;
                    }
                } catch (e) {
                    console.error("Failed to fetch conference by ID", e);
                }
            }

            if (!conf) {
                // Fallback to first one
                const confRes = await conferenceApi.getConferences();
                if (confRes.success && confRes.data && confRes.data.items.length > 0) {
                    conf = confRes.data.items[0];
                }
            }

            if (conf) {
                // Security Check: Client-side
                if (user && conf.createdBy !== user.id) {
                    alert("Bạn không có quyền quản lý hội nghị này!");
                    onNavigate('chair-dashboard');
                    return;
                }

                setConference(conf);

                // 2. Get CFP
                try {
                    const cfpRes = await conferenceApi.getCallForPapers(conf.conferenceId);
                    if (cfpRes.success && cfpRes.data) {
                        const cfp = cfpRes.data;
                        console.log("RECEIVED CFP DATA:", cfp); // Debug log
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
            // Call API to update CFP
            const res = await conferenceApi.updateCallForPapers(conference.conferenceId, {
                title,
                content,
                submissionGuidelines: guidelines,
                isPublished
            });
            if (res.success) {
                alert("Lưu thành công!");
                if (isPublished) {
                    alert("CFP đã được công khai trên trang chủ!");
                }
                // Reload data to ensure sync
                fetchConferenceAndCFP();
            } else {
                throw new Error(res.message || "Failed");
            }
        } catch (error) {
            alert("Lỗi khi lưu CFP");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!conference) return <div className="p-8 text-center">Bạn chưa tạo hội nghị nào. <button onClick={() => onNavigate('create-conference')} className="text-primary underline">Tạo ngay</button></div>;

    return (
        <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
            <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-md border border-border-light">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-primary">Thiết lập Call For Papers (CFP)</h1>
                    <button onClick={() => onNavigate('chair-dashboard')} className="text-gray-500 hover:text-gray-700">
                        Quay lại Dashboard
                    </button>
                </div>

                <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-lg">
                    Đang cấu hình cho hội nghị: <strong>{conference.name}</strong>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tiêu đề bản tin CFP</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={`Ví dụ: Mời nộp bài cho ${conference.acronym}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Nội dung giới thiệu</label>
                        <textarea
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none h-32"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Giới thiệu về chủ đề hội nghị, mục tiêu..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Hướng dẫn nộp bài (Submission Guidelines)</label>
                        <textarea
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none h-32"
                            value={guidelines}
                            onChange={e => setGuidelines(e.target.value)}
                            placeholder="Định dạng PDF, tối đa 10 trang, font Times New Roman..."
                        />
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <input
                            type="checkbox"
                            id="publish"
                            className="w-5 h-5 text-primary rounded"
                            checked={isPublished}
                            onChange={e => setIsPublished(e.target.checked)}
                        />
                        <label htmlFor="publish" className="cursor-pointer select-none">
                            <span className="block font-bold text-gray-800">Publish Conference (Công khai)</span>
                            <span className="text-sm text-gray-500">Khi bật tuỳ chọn này, hội nghị sẽ xuất hiện trên trang chủ và cho phép tác giả nộp bài.</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={() => onNavigate('chair-dashboard')} className="px-6 py-2 rounded text-gray-600 hover:bg-gray-100">Hủy</button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-6 py-2 rounded text-white font-bold bg-primary hover:bg-primary-hover shadow-md ${saving ? 'opacity-50' : ''}`}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu & Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
