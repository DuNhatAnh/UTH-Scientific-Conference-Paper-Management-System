import React, { useState, useEffect } from 'react';
import { PDFPreview } from '../../components/PDFPreview';
import { ReviewForm } from '../../components/ReviewForm';
import { reviewerApi, ReviewerInvitationDto, ReviewableSubmissionDto } from '../../services/reviewerApi';
import reviewApi from '../../services/reviewApi';

export const ReviewerDashboard: React.FC = () => {
    // UI State
    const [viewMode, setViewMode] = useState<'overview' | 'detail' | 'invitations'>('overview');

    // Data State
    const [invitations, setInvitations] = useState<ReviewerInvitationDto[]>([]);
    const [submissions, setSubmissions] = useState<ReviewableSubmissionDto[]>([]);

    // Selection State
    const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);

    // Initial Load
    const loadAllData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Fetch both invitations and all submissions in parallel
            const [inviteResp, subResp] = await Promise.all([
                reviewerApi.getMyInvitations(),
                reviewerApi.getAllMySubmissions()
            ]);

            // Now reviewerApi will be updated to return data directly
            setInvitations(Array.isArray(inviteResp) ? inviteResp : (inviteResp as any).data || []);
            setSubmissions(Array.isArray(subResp) ? subResp : (subResp as any).data || []);
        } catch (err) {
            console.error('Failed to load dashboard data', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // Handle Actions
    const handleRespond = async (invite: ReviewerInvitationDto, isAccepted: boolean) => {
        if (!window.confirm(`Bạn có chắc chắn muốn ${isAccepted ? 'chấp nhận' : 'từ chối'} lời mời này?`)) return;

        try {
            await reviewerApi.respondInvitation({
                token: invite.token!,
                isAccepted
            });
            await loadAllData();
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra.');
        }
    };

    const handleAcceptAssignment = async (assignmentId: number) => {
        try {
            const res = await reviewApi.acceptAssignment(assignmentId);
            // Check success if present, otherwise assume success if no error thrown
            if (res === null || res === undefined || (res as any).success !== false) {
                alert('Đã chấp nhận phân công!');
                loadAllData(true); // Silent refresh
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi chấp nhận phân công');
        }
    };

    const handleRejectAssignment = async (assignmentId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn từ chối phân công này?')) return;
        try {
            const res = await reviewApi.declineAssignment(assignmentId);
            if (res === null || res === undefined || (res as any).success !== false) {
                alert('Đã từ chối phân công.');
                loadAllData(true);
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi từ chối phân công');
        }
    };

    const handleDeleteInvitation = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lời mời này khỏi danh sách không?')) return;
        try {
            await reviewerApi.deleteInvitation(id);
            await loadAllData();
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi xóa lời mời.');
        }
    };

    const handleBackToOverview = () => {
        setSelectedPaperId(null);
        setViewMode('overview');
    };

    // Derived Lists
    const pendingInvites = invitations.filter(i => i.status === 'Pending');
    const acceptedInvites = invitations.filter(i => i.status === 'Accepted');

    // Group submissions by conference
    const groupedSubmissions = submissions.reduce((acc, sub) => {
        const confKey = sub.conferenceId || 'Other';
        const confName = sub.conferenceName || sub.conferenceId || 'Khác';
        if (!acc[confKey]) {
            acc[confKey] = { name: confName, items: [] };
        }
        acc[confKey].items.push(sub);
        return acc;
    }, {} as Record<string, { name: string, items: ReviewableSubmissionDto[] }>);

    if (loading && viewMode === 'overview') {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    const selectedPaper = submissions.find(s => s.id === selectedPaperId);

    return (
        <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center min-h-[calc(100vh-80px)]">
            <div className="w-full max-w-[1240px]">

                {/* --- HEADER --- */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        {(viewMode !== 'overview') && (
                            <button onClick={handleBackToOverview} className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-700 transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
                            {viewMode === 'overview' ? 'Danh sách công việc của tôi' :
                                viewMode === 'invitations' ? 'Quản lý lời mời' : 'Đánh giá bài báo'}
                        </h1>
                    </div>
                    {viewMode === 'overview' && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setViewMode('invitations')}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card-dark border border-border-light rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium relative"
                            >
                                <span className="material-symbols-outlined text-blue-600">manage_accounts</span>
                                {pendingInvites.length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                                        {pendingInvites.length}
                                    </span>
                                )}
                                Quản lý lời mời
                            </button>
                        </div>
                    )}
                </div>

                {/* --- OVERVIEW VIEW --- */}
                {viewMode === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* 1. Statistics Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                            <div className="bg-white dark:bg-card-dark p-5 rounded-2xl shadow-sm border border-border-light flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined">article</span>
                                </div>
                                <div>
                                    <h4 className="text-sm text-text-sec-light">Tổng bài báo</h4>
                                    <p className="text-2xl font-bold">{submissions.length}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-card-dark p-5 rounded-2xl shadow-sm border border-border-light flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined">task_alt</span>
                                </div>
                                <div>
                                    <h4 className="text-sm text-text-sec-light">Đã hoàn thành</h4>
                                    <p className="text-2xl font-bold">{submissions.filter(s => s.reviewStatus === 'Submitted').length}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-card-dark p-5 rounded-2xl shadow-sm border border-border-light flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined">pending</span>
                                </div>
                                <div>
                                    <h4 className="text-sm text-text-sec-light">Đang thực hiện</h4>
                                    <p className="text-2xl font-bold">{submissions.filter(s => s.reviewStatus !== 'Submitted').length}</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Grouped Submissions */}
                        {Object.keys(groupedSubmissions).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-card-dark rounded-3xl border border-dashed border-gray-300">
                                <span className="material-symbols-outlined text-[64px] text-gray-200 mb-4">folder_open</span>
                                <h3 className="text-lg font-bold text-gray-500">Chưa có bài báo nào được gán</h3>
                                <p className="text-gray-400 text-sm mt-1">Các bài báo được Chair phân công sẽ hiển thị tại đây.</p>
                            </div>
                        ) : (
                            Object.entries(groupedSubmissions).map(([confId, data]) => (
                                <section key={confId} className="space-y-4">
                                    <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
                                        <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark uppercase tracking-tight">
                                            {data.name}
                                        </h2>
                                        <span className="bg-gray-100 dark:bg-gray-800 text-[10px] font-bold px-2 py-0.5 rounded text-gray-500">
                                            {data.items.length} bài báo
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {data.items.map(paper => (
                                            <div
                                                key={paper.id}
                                                onClick={() => {
                                                    if (paper.reviewStatus !== 'Pending') {
                                                        setSelectedPaperId(paper.id);
                                                        setViewMode('detail');
                                                    }
                                                }}
                                                className={`bg-white dark:bg-card-dark p-5 rounded-2xl border transition-all hover:shadow-xl group
                                                    ${paper.reviewStatus === 'Pending' ? 'border-yellow-100 bg-yellow-50/20' : 'cursor-pointer border-border-light hover:border-primary'}`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded">#{paper.paperNumber}</span>
                                                    <ReviewStatusBadge status={paper.reviewStatus} />
                                                </div>

                                                <h3 className="font-bold text-base mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[44px]">
                                                    {paper.title}
                                                </h3>

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {paper.trackName && (
                                                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                                                            {paper.trackName}
                                                        </span>
                                                    )}
                                                </div>

                                                {paper.reviewStatus === 'Pending' ? (
                                                    <div className="flex gap-2 pt-2 border-t border-yellow-100">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAcceptAssignment(paper.assignmentId!);
                                                            }}
                                                            className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-xl hover:bg-primary-hover shadow-sm transition-all"
                                                        >
                                                            Đồng ý chấm
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRejectAssignment(paper.assignmentId!);
                                                            }}
                                                            className="px-3 bg-white border border-gray-200 text-gray-600 text-xs font-bold py-2 rounded-xl hover:bg-gray-50 transition-all"
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center pt-3 border-t border-gray-50 mt-auto">
                                                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                                            {new Date(paper.submittedAt).toLocaleDateString("vi-VN")}
                                                        </span>
                                                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">play_circle</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))
                        )}
                    </div>
                )}

                {/* --- DETAIL VIEW --- */}
                {viewMode === 'detail' && selectedPaper && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <div className="bg-white dark:bg-card-dark rounded-3xl border border-border-light shadow-2xl overflow-hidden flex flex-col min-h-[85vh]">
                            {/* Paper Header */}
                            <div className="bg-primary text-white p-6 md:p-8 relative">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold font-mono">
                                        Mã số: #{selectedPaper.paperNumber}
                                    </span>
                                    <button
                                        onClick={handleBackToOverview}
                                        className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{selectedPaper.title}</h2>
                                <div className="flex flex-wrap items-center gap-6 text-sm opacity-90">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">group</span>
                                        Tác giả: {selectedPaper.authors.join(', ')}
                                    </div>
                                    <div className="flex items-center gap-2 text-primary bg-white px-3 py-1 rounded-full font-bold text-xs">
                                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                        Trạng thái: {selectedPaper.reviewStatus}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 xl:grid-cols-2">
                                {/* Left: PDF Preview */}
                                <div className="border-r border-border-light bg-gray-100 flex flex-col overflow-hidden h-[600px] xl:h-auto">
                                    <div className="p-4 bg-gray-50 flex justify-between items-center border-b border-border-light">
                                        <span className="font-bold flex items-center gap-2 text-sm">
                                            <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                                            Bản thảo bài báo
                                        </span>
                                        <a
                                            href={`http://localhost:5000/api/submissions/${selectedPaper.id}/files/${selectedPaper.fileId}/download`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary text-xs font-bold hover:underline"
                                        >
                                            Mở tab mới
                                        </a>
                                    </div>
                                    <div className="flex-1">
                                        <PDFPreview
                                            fileName={selectedPaper.fileName}
                                            fileUrl={`http://localhost:5000/api/submissions/${selectedPaper.id}/files/${selectedPaper.fileId}/download`}
                                            fileSize={selectedPaper.fileSizeBytes}
                                        />
                                    </div>
                                </div>

                                {/* Right: Review Form */}
                                <div className="overflow-y-auto p-6 md:p-10 bg-white">
                                    <div className="max-w-[700px] mx-auto">
                                        <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-gray-800">
                                            <span className="material-symbols-outlined text-primary">rate_review</span>
                                            Nội dung đánh giá
                                        </h3>
                                        <ReviewForm
                                            paperId={selectedPaper.id}
                                            onSuccess={() => loadAllData(true)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- INVITATIONS MANAGEMENT VIEW --- */}
                {viewMode === 'invitations' && (
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-border-light shadow-xl overflow-hidden animate-fade-in">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="font-bold text-lg">Lời mời mới & Lịch sử</h2>
                            <span className="text-xs text-text-sec-light">Quản lý quyền tham gia vào các hội đồng PC</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-left">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hội nghị</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Người mời</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày gửi</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {invitations.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic bg-gray-50/50">
                                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">mail_outline</span>
                                                <p>Anh chưa nhận được lời mời nào</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        invitations.map(inv => (
                                            <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-blue-600">{inv.conferenceName || inv.conferenceId}</span>
                                                    <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{inv.conferenceId}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {inv.status === 'Pending' && <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-yellow-100 text-yellow-700 uppercase tracking-wider">Chờ phản hồi</span>}
                                                    {inv.status === 'Accepted' && <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-700 uppercase tracking-wider">Đã tham gia</span>}
                                                    {inv.status === 'Declined' && <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-red-100 text-red-700 uppercase tracking-wider">Đã từ chối</span>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{inv.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.sentAt).toLocaleDateString("vi-VN")}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {inv.status === 'Pending' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleRespond(inv, true)}
                                                                    className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 shadow-sm"
                                                                >
                                                                    Đồng ý
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRespond(inv, false)}
                                                                    className="px-4 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 border border-red-200"
                                                                >
                                                                    Từ chối
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDeleteInvitation(inv.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                                title="Xóa lịch sử"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ReviewStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    switch (status) {
        case 'Submitted':
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-green-500 text-white">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    HOÀN THÀNH
                </span>
            );
        case 'Draft':
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-blue-500 text-white">
                    <span className="material-symbols-outlined text-[14px]">edit_note</span>
                    ĐANG CHẤM
                </span>
            );
        case 'Accepted':
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    SẴN SÀNG
                </span>
            );
        case 'Pending':
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-400 text-white shadow-sm animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    MỚI
                </span>
            );
        default:
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                    <span className="material-symbols-outlined text-[14px]">help_outline</span>
                    CHƯA RÕ
                </span>
            );
    }
}
