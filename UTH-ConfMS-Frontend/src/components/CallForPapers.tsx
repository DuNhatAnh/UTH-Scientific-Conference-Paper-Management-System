
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ViewState } from '../App';
import conferenceApi, { CallForPapersDto, ConferenceDto } from '../services/conferenceApi';

interface CallForPapersProps {
    onNavigate: (view: ViewState) => void;
    conferenceId?: string; // Optional: nếu có thì chỉ hiển thị 1 hội nghị (cho preview)
}

interface ConferenceCFP {
    conference: ConferenceDto;
    cfp: CallForPapersDto;
}

export const CallForPapers: React.FC<CallForPapersProps> = ({ onNavigate, conferenceId }) => {
    const [conferences, setConferences] = useState<ConferenceCFP[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllCFPs = async () => {
            setLoading(true);
            setError(null);
            try {
                // Nếu có conferenceId, chỉ load 1 hội nghị đó (cho preview)
                if (conferenceId) {
                    const [cfpRes, confRes] = await Promise.all([
                        conferenceApi.getCallForPapers(conferenceId),
                        conferenceApi.getConference(conferenceId)
                    ]);

                    if (cfpRes.success && cfpRes.data && confRes.success && confRes.data) {
                        setConferences([{ conference: confRes.data, cfp: cfpRes.data }]);
                    } else {
                        setError("Không tìm thấy thông tin CFP của hội nghị này.");
                    }
                    return;
                }

                // Nếu không có conferenceId, load tất cả hội nghị đang mở
                const confRes = await conferenceApi.getConferences();
                if (confRes.success && confRes.data) {
                    // @ts-ignore
                    const list = confRes.data.items || confRes.data.data || [];
                    
                    if (list.length === 0) {
                        setError("Chưa có hội nghị nào được tổ chức.");
                        return;
                    }

                    // Lấy CFP cho tất cả hội nghị đang mở đợt kêu gọi bài
                    const cfpPromises = list
                        .filter((conf: ConferenceDto) => {
                            const now = new Date();
                            const deadline = new Date(conf.submissionDeadline);
                            return deadline > now; // Chỉ lấy hội nghị còn nhận bài
                        })
                        .map(async (conf: ConferenceDto) => {
                            try {
                                const cfpRes = await conferenceApi.getCallForPapers(conf.conferenceId);
                                if (cfpRes.success && cfpRes.data) {
                                    return { conference: conf, cfp: cfpRes.data };
                                }
                                return null;
                            } catch {
                                return null;
                            }
                        });

                    const results = await Promise.all(cfpPromises);
                    const validCFPs = results.filter((item): item is ConferenceCFP => item !== null);
                    
                    if (validCFPs.length === 0) {
                        setError("Hiện không có hội nghị nào đang mở đợt kêu gọi bài.");
                    } else {
                        setConferences(validCFPs);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch CFPs", err);
                setError("Lỗi kết nối đến server. Hãy đảm bảo Backend đang chạy.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllCFPs();
    }, [conferenceId]);

    if (loading) return (
        <div className="p-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-primary font-medium">Đang tải nội dung...</p>
        </div>
    );

    if (error || conferences.length === 0) return (
        <div className="p-20 text-center flex flex-col items-center gap-4 bg-red-50 rounded-xl m-10 border border-red-100">
            <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
            <p className="text-red-600 font-bold">{error || "Hiện không có hội nghị nào đang mở đợt kêu gọi bài."}</p>
            <Link to="/" className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                Quay lại trang chủ
            </Link>
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

    // Nếu chỉ có 1 hội nghị (mode preview), hiển thị dạng chi tiết
    if (conferences.length === 1 && conferenceId) {
        const { conference, cfp } = conferences[0];
        return <CFPDetailView conference={conference} cfp={cfp} formatDate={formatDate} />;
    }

    // Nếu có nhiều hội nghị, hiển thị dạng grid
    return (
        <div className="w-full min-h-screen bg-[#f0f4f8] dark:bg-[#0f172a] font-display">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary blur-[120px]"></div>
                <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400 blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-[1400px] mx-auto py-12 px-5 lg:px-8">
                {/* Page Header */}
                <header className="mb-12 text-center">
                    <h1 className="text-5xl md:text-6xl font-black text-gray-800 dark:text-white mb-4">
                        Kêu Gọi Viết Bài
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        Khám phá các hội nghị đang mở đợt kêu gọi bài và nộp bài nghiên cứu của bạn
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                        <span className="material-symbols-outlined text-primary">event_available</span>
                        <span className="text-sm font-bold text-primary">{conferences.length} hội nghị đang nhận bài</span>
                    </div>
                </header>

                {/* Conferences Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {conferences.map(({ conference, cfp }) => (
                        <CFPCard key={conference.conferenceId} conference={conference} cfp={cfp} formatDate={formatDate} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// CFP Detail View Component (for single conference preview)
const CFPDetailView: React.FC<{ conference: ConferenceDto, cfp: CallForPapersDto, formatDate: (date?: string) => string }> = ({ conference, cfp, formatDate }) => {
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
                                <Link
                                    to={`/author/submit?conferenceId=${conference.conferenceId}`}
                                    className="group relative px-8 py-4 bg-white text-primary font-black rounded-2xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                                >
                                    <span className="flex items-center gap-2">
                                        NỘP BÀI NGAY
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </span>
                                </Link>
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
                        {/* Overview Section */}
                        <section className="bg-white dark:bg-card-dark rounded-3xl p-8 shadow-xl border border-white/50 dark:border-white/5">
                            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">info</span>
                                Thông tin sơ lược
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Tiêu đề</h4>
                                    <p className="font-bold text-gray-800 dark:text-white text-lg">{cfp.title}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Giới thiệu</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
                                        {cfp.content ? (cfp.content.length > 200 ? cfp.content.substring(0, 200) + '...' : cfp.content) : 'Chưa có nội dung giới thiệu.'}
                                    </p>
                                </div>
                            </div>
                        </section>
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
        </div>
    );
};

// CFP Card Component
const CFPCard: React.FC<{ conference: ConferenceDto, cfp: CallForPapersDto, formatDate: (date?: string) => string }> = ({ conference, cfp, formatDate }) => {
    const daysUntilDeadline = Math.ceil((new Date(conference.submissionDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = daysUntilDeadline <= 7;

    return (
        <article className="group bg-white dark:bg-card-dark rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all border border-white/50 dark:border-white/5">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary via-[#004494] to-indigo-900 p-8">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                        <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-xs font-bold uppercase tracking-wider">
                            {conference.acronym}
                        </div>
                        {isUrgent && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-red-500/90 rounded-full">
                                <span className="material-symbols-outlined text-xs text-white">schedule</span>
                                <span className="text-xs font-bold text-white">Sắp hết hạn</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3 line-clamp-2">
                        {cfp.title}
                    </h2>
                    <p className="text-blue-100/80 text-sm line-clamp-2">
                        {conference.name}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-8">
                {/* Conference Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-primary text-xl">event</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Hạn nộp</p>
                            <p className="text-sm font-black text-gray-800 dark:text-white">{formatDate(conference.submissionDeadline)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Địa điểm</p>
                            <p className="text-sm font-black text-gray-800 dark:text-white truncate">{conference.location || "Online"}</p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                        {cfp.content || "Chúng tôi trân trọng kính mời quý thầy cô, các nhà khoa học và nghiên cứu sinh gửi bài tham dự hội nghị."}
                    </p>
                </div>

                {/* Timeline Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <div className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400">
                        <span className="text-primary font-black">{daysUntilDeadline}</span> ngày còn lại
                    </div>
                    <div className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Diễn ra: {formatDate(conference.startDate)}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Link
                        to={`/conferences/${conference.conferenceId}`}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-center"
                    >
                        Chi tiết
                    </Link>
                    <Link
                        to={`/author/submit?conferenceId=${conference.conferenceId}`}
                        className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-center flex items-center justify-center gap-2 group"
                    >
                        Nộp bài
                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </article>
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
