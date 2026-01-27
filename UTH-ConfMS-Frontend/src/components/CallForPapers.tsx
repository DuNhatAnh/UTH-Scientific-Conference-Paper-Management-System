
import React, { useEffect, useState } from 'react';
import { ViewState } from '../App';
import conferenceApi, { CallForPapersDto, ConferenceDto } from '../services/conferenceApi';

interface CallForPapersProps {
    onNavigate: (view: ViewState) => void;
    conferenceId?: string;
}

export const CallForPapers: React.FC<CallForPapersProps> = ({ onNavigate, conferenceId }) => {
    const [cfp, setCfp] = useState<CallForPapersDto | null>(null);
    const [conference, setConference] = useState<ConferenceDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCfp = async () => {
            setLoading(true);
            setError(null);
            try {
                let id = conferenceId;

                if (!id) {
                    const confRes = await conferenceApi.getConferences();
                    if (confRes.success && confRes.data && confRes.data.items.length > 0) {
                        // @ts-ignore
                        const list = confRes.data.items || confRes.data.data || [];
                        if (list.length > 0) {
                            id = list[0].conferenceId;
                        }
                    }
                }

                if (id) {
                    const [cfpRes, confRes] = await Promise.all([
                        conferenceApi.getCallForPapers(id),
                        conferenceApi.getConference(id)
                    ]);

                    if (cfpRes.success && cfpRes.data) {
                        setCfp(cfpRes.data);
                    } else {
                        setError(cfpRes.message || "Không tìm thấy dữ liệu CFP.");
                    }

                    if (confRes.success && confRes.data) {
                        setConference(confRes.data);
                    }
                } else {
                    setError("Không tìm thấy hội nghị nào đang mở.");
                }
            } catch (err) {
                console.error("Failed to fetch CFP", err);
                setError("Lỗi kết nối đến server. Hãy đảm bảo Backend đang chạy.");
            } finally {
                setLoading(false);
            }
        };

        fetchCfp();
    }, [conferenceId]);

    if (loading) return (
        <div className="p-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-primary font-medium">Đang tải nội dung...</p>
        </div>
    );

    if (error || !cfp) return (
        <div className="p-20 text-center flex flex-col items-center gap-4 bg-red-50 rounded-xl m-10 border border-red-100">
            <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
            <p className="text-red-600 font-bold">{error || "Hội nghị này chưa có thông tin gọi bài báo."}</p>
            <button onClick={() => onNavigate('home')} className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                Quay lại trang chủ
            </button>
        </div>
    );

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'TBA';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="w-full min-h-screen bg-[#f0f4f8] dark:bg-[#0f172a] font-display">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary blur-[120px]"></div>
                <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400 blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-[1200px] mx-auto py-12 px-5 lg:px-0">
                {/* Hero Section */}
                <header className="relative mb-12 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#004494] to-indigo-900 opacity-95"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

                    <div className="relative p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block px-4 py-1.5 mb-6 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/90 text-sm font-bold tracking-wider uppercase">
                                {conference?.acronym || "CFP"} 2026
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                                {cfp.title || "Kêu Gọi Viết Bài"}
                            </h1>
                            <p className="text-xl text-blue-100/90 mb-10 leading-relaxed font-medium max-w-2xl whitespace-pre-wrap">
                                {cfp.content || "Chúng tôi trân trọng kính mời quý thầy cô, các nhà khoa học và nghiên cứu sinh gửi bài tham dự hội nghị."}
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <button
                                    onClick={() => onNavigate('login')}
                                    className="group relative px-8 py-4 bg-white text-primary font-black rounded-2xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                                >
                                    <span className="flex items-center gap-2">
                                        NỘP BÀI NGAY
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </span>
                                </button>
                                <button
                                    onClick={() => document.getElementById('guidelines')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold border-2 border-white/20 rounded-2xl hover:bg-white/20 transition-all"
                                >
                                    Xem hướng dẫn
                                </button>
                            </div>
                        </div>

                        {/* Interactive Stats Panel */}
                        <div className="hidden lg:block w-72 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-white shadow-xl">
                            <div className="space-y-8">
                                <div>
                                    <div className="text-blue-200 text-sm font-bold mb-1">Hạn nộp bài</div>
                                    <div className="text-2xl font-black">{formatDate(conference?.submissionDeadline)}</div>
                                </div>
                                <div>
                                    <div className="text-blue-200 text-sm font-bold mb-1">Địa điểm</div>
                                    <div className="text-xl font-bold truncate">{conference?.location || "Trực tuyến"}</div>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                        </div>
                                        <div className="text-xs text-white/70 leading-tight">Vui lòng kiểm tra kỹ múi giờ trước khi nộp.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Guidelines */}
                    <div id="guidelines" className="lg:col-span-2 space-y-8">
                        <section className="bg-white dark:bg-card-dark rounded-3xl p-8 md:p-10 shadow-xl border border-white/50 dark:border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>

                            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3">
                                <span className="p-3 rounded-2xl bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined">menu_book</span>
                                </span>
                                Quy định & Hướng dẫn nộp bài
                            </h2>

                            <div className="prose prose-blue dark:prose-invert max-w-none">
                                <div className="whitespace-pre-wrap text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                    {cfp.submissionGuidelines}
                                </div>
                            </div>

                            {/* New: Status Badges Container */}
                            <div className="mt-8 flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                                    <span className="material-symbols-outlined text-sm text-primary">picture_as_pdf</span>
                                    <span className="text-sm font-bold">Định dạng: PDF</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                                    <span className="material-symbols-outlined text-sm text-primary">verified</span>
                                    <span className="text-sm font-bold">Peer Review</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar: Timeline & Info */}
                    <aside className="space-y-8">
                        {/* Timeline Section */}
                        <section className="bg-white dark:bg-card-dark rounded-3xl p-8 shadow-xl border border-white/50 dark:border-white/5">
                            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">event_upcoming</span>
                                Các mốc thời gian
                            </h3>

                            <div className="space-y-6">
                                <TimelineItem
                                    label="Hạn nộp bài báo"
                                    date={formatDate(conference?.submissionDeadline)}
                                    isDone={new Date() > new Date(conference?.submissionDeadline || '')}
                                    isActive={true}
                                />
                                <TimelineItem
                                    label="Thông báo kết quả"
                                    date={formatDate(conference?.notificationDate)}
                                />
                                <TimelineItem
                                    label="Hạn nộp bản cuối"
                                    date={formatDate(conference?.cameraReadyDeadline)}
                                />
                                <TimelineItem
                                    label="Ngày diễn ra"
                                    date={formatDate(conference?.startDate)}
                                    isHighlight={true}
                                />
                            </div>
                        </section>

                        {/* Contact Card */}
                        <section className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl p-8 text-white shadow-xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined">contact_support</span>
                                </div>
                                <div>
                                    <h4 className="font-black">Hỗ trợ?</h4>
                                    <p className="text-xs text-white/50">Chúng tôi sẵn sàng giúp đỡ</p>
                                </div>
                            </div>
                            <p className="text-sm text-blue-100/70 mb-6 leading-relaxed">
                                Nếu bạn gặp bất kỳ khó khăn nào trong quá trình nộp bài, vui lòng liên hệ Ban Thư ký Hội nghị.
                            </p>
                            <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all">
                                Liên hệ Ban Tổ Chức
                            </button>
                        </section>
                    </aside>
                </div>
            </div>

            {/* Sticky Navigation */}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 items-end">
                <button
                    onClick={() => window.history.back()}
                    className="group flex items-center gap-3 px-8 py-4 bg-white/90 dark:bg-card-dark/90 backdrop-blur-md text-gray-800 dark:text-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-white/50 dark:border-white/10 font-black hover:bg-white dark:hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                >
                    <span className="material-symbols-outlined text-2xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    QUAY LẠI
                </button>
                <button
                    onClick={() => onNavigate('home')}
                    className="group flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl shadow-[0_10px_30px_rgba(59,130,246,0.3)] border border-primary/20 font-black hover:scale-110 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">home</span>
                    TRANG CHỦ
                </button>
            </div>
        </div>
    );
};

// Helper Components
const TimelineItem: React.FC<{ label: string, date: string, isDone?: boolean, isActive?: boolean, isHighlight?: boolean }> = ({ label, date, isDone, isActive, isHighlight }) => (
    <div className={`relative flex items-center gap-4 p-3 rounded-2xl transition-all ${isHighlight ? 'bg-primary/5 border border-primary/20 scale-105' : ''}`}>
        <div className={`w-3 h-3 rounded-full ${isDone ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : isActive ? 'bg-primary animate-pulse' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
        <div className="flex-1">
            <div className={`text-xs font-bold uppercase tracking-wider ${isDone ? 'text-green-600' : isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>{label}</div>
            <div className={`text-sm font-black ${isHighlight ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>{date}</div>
        </div>
    </div>
);
