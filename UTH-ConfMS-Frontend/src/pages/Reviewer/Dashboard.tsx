import React, { useState, useEffect } from 'react';
import { PDFPreview } from '../../components/PDFPreview';
import { ReviewForm } from '../../components/ReviewForm';
import { reviewerApi, ReviewerInvitationDto, ReviewableSubmissionDto } from '../../services/reviewerApi';

export const ReviewerDashboard: React.FC = () => {
    // UI State
    const [viewMode, setViewMode] = useState<'overview' | 'detail' | 'invitations'>('overview');

    // Data State
    const [invitations, setInvitations] = useState<ReviewerInvitationDto[]>([]);
    const [submissions, setSubmissions] = useState<ReviewableSubmissionDto[]>([]);

    // Selection State
    const [selectedConference, setSelectedConference] = useState<ReviewerInvitationDto | null>(null);
    const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);

    // Initial Load
    const fetchInvitations = async () => {
        setLoading(true);
        try {
            const resp = await reviewerApi.getMyInvitations();
            const data = (resp as any).data ?? (resp as any);
            setInvitations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load invitations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    // Handle Actions
    const handleRespond = async (invite: ReviewerInvitationDto, isAccepted: boolean) => {
        if (!window.confirm(`Bạn có chắc chắn muốn ${isAccepted ? 'chấp nhận' : 'từ chối'} lời mời này?`)) return;

        try {
            await reviewerApi.respondInvitation({
                token: invite.token!,
                isAccepted
            });
            await fetchInvitations(); // Reload list
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra.');
        }
    };

    const handleDeleteInvitation = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lời mời này khỏi danh sách không?')) return;
        try {
            await reviewerApi.deleteInvitation(id);
            await fetchInvitations(); // Reload list
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi xóa lời mời.');
        }
    };

    const handleSelectConference = async (invite: ReviewerInvitationDto) => {
        setSelectedConference(invite);
        setViewMode('detail');
        setLoading(true);
        try {
            const subResp = await reviewerApi.getReviewableSubmissions(invite.conferenceId);
            const subData = (subResp as any).data ?? subResp;
            setSubmissions(Array.isArray(subData) ? subData : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToOverview = () => {
        setSelectedConference(null);
        setSubmissions([]);
        setSelectedPaperId(null);
        setSelectedPaperId(null);
        setViewMode('overview');
    };

    const handleBackFromInvitations = () => {
        setViewMode('overview');
    };

    // Derived Lists
    const pendingInvites = invitations.filter(i => i.status === 'Pending');
    const acceptedInvites = invitations.filter(i => i.status === 'Accepted');

    if (loading && viewMode === 'overview') {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center min-h-[calc(100vh-80px)]">
            <div className="w-full max-w-[1200px]">

                {/* --- HEADER --- */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        {(viewMode === 'detail' || viewMode === 'invitations') && (
                            <button onClick={handleBackToOverview} className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-700 transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
                            {viewMode === 'overview' ? 'Reviewer Dashboard' :
                                viewMode === 'invitations' ? 'Quản lý lời mời' :
                                    `Hội đồng: ${selectedConference?.conferenceName || selectedConference?.conferenceId}`}
                        </h1>
                    </div>
                    {viewMode === 'overview' && (
                        <button
                            onClick={() => setViewMode('invitations')}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card-dark border border-border-light rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-blue-600">manage_accounts</span>
                            Quản lý lời mời
                        </button>
                    )}
                </div>

                {/* --- OVERVIEW VIEW --- */}
                {viewMode === 'overview' && (
                    <div className="space-y-10">

                        {/* 1. Pending Invitations */}
                        {pendingInvites.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">mail</span>
                                    Lời mời tham gia ({pendingInvites.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pendingInvites.map(invite => (
                                        <div key={invite.id} className="bg-white dark:bg-card-dark border border-blue-200 dark:border-blue-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg mb-1">{invite.conferenceName || invite.conferenceId}</h3>
                                                    <p className="text-sm text-text-sec-light">Mời bởi: {invite.email}</p>
                                                    <p className="text-xs text-gray-400 mt-2">{new Date(invite.sentAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button onClick={() => handleRespond(invite, true)} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
                                                        Chấp nhận
                                                    </button>
                                                    <button onClick={() => handleRespond(invite, false)} className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 font-medium">
                                                        Từ chối
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. My Councils (Accepted) */}
                        <section>
                            <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined">groups</span>
                                Hội đồng của tôi ({acceptedInvites.length})
                            </h2>
                            {acceptedInvites.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 dark:bg-card-dark rounded-xl border border-dashed border-gray-300">
                                    <p className="text-text-sec-light">Bạn chưa tham gia hội đồng nào.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {acceptedInvites.map(invite => (
                                        <div
                                            key={invite.id}
                                            onClick={() => handleSelectConference(invite)}
                                            className="bg-white dark:bg-card-dark border border-border-light p-5 rounded-xl shadow-sm hover:shadow-md hover:border-primary cursor-pointer transition-all group"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined">assignment_ind</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{invite.conferenceName || invite.conferenceId}</h3>
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Thành viên</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-4">
                                                <span className="text-sm text-text-sec-light">Truy cập danh sách bài nộp</span>
                                                <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* --- DETAIL VIEW --- */}
                {viewMode === 'detail' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Submission List */}
                        <div className={`lg:col-span-${selectedPaperId ? '1' : '3'} flex flex-col gap-4 animate-fade-in`}>
                            {submissions.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-card-dark rounded-xl shadow-sm">
                                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">folder_off</span>
                                    <p className="text-lg text-gray-500">Chưa có bài nộp nào trong hội nghị này</p>
                                </div>
                            ) : (
                                submissions.map(paper => (
                                    <div
                                        key={paper.id}
                                        onClick={() => setSelectedPaperId(paper.id)}
                                        className={`bg-white dark:bg-card-dark p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md
                                            ${selectedPaperId === paper.id ? 'border-primary ring-1 ring-primary' : 'border-border-light'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">#{paper.paperNumber}</span>
                                                {paper.reviewStatus === 'Submitted' || paper.reviewStatus === 'Draft' ? (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                        {paper.reviewStatus === 'Draft' ? 'Đang đánh giá' : 'Đã đánh giá'}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                                                        <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span>
                                                        Chưa đánh giá
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400">{new Date(paper.submittedAt).toLocaleDateString()}</span>
                                        </div>

                                        <h3 className="font-bold text-base mb-1 hover:text-primary transition-colors line-clamp-2" title={paper.title}>
                                            {paper.title}
                                        </h3>
                                        <div className="text-xs text-text-sec-light mb-2">
                                            {paper.trackName && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded mr-2">{paper.trackName}</span>}
                                        </div>

                                        {selectedPaperId !== paper.id && (
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-2">{paper.abstract}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Detail Panel */}
                        {selectedPaperId && (
                            <div className="lg:col-span-2 bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-xl flex flex-col h-[800px] sticky top-5 animate-slide-in-right">
                                <div className="p-4 border-b border-border-light flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Review Submission</h3>
                                    <button onClick={() => setSelectedPaperId(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors material-symbols-outlined text-gray-500">close</button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-0">
                                    {/* Tabs or Split View could go here. For now, PDF + Form Placeholder */}
                                    <div className="flex flex-col h-full">
                                        {/* Paper Info Header */}
                                        <div className="p-5 border-b border-gray-100">
                                            <h2 className="text-xl font-bold mb-2">{submissions.find(s => s.id === selectedPaperId)?.title}</h2>
                                            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                                <span>Authors: {submissions.find(s => s.id === selectedPaperId)?.authors.join(', ')}</span>
                                            </div>
                                            <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                {submissions.find(s => s.id === selectedPaperId)?.abstract}
                                            </p>
                                        </div>

                                        {/* Review Area */}
                                        <div className="flex-1 p-5 bg-gray-50 overflow-y-auto">
                                            {/* PDF Preview */}
                                            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="h-[500px]">
                                                    {(() => {
                                                        const p = submissions.find(s => s.id === selectedPaperId);
                                                        return p ? <PDFPreview fileName={p.fileName} /> : null;
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Note for User */}
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 items-start">
                                                <span className="material-symbols-outlined text-yellow-600">info</span>
                                                <div>
                                                    <h4 className="font-bold text-yellow-800 text-sm">Chức năng đánh giá</h4>
                                                    <p className="text-sm text-yellow-700 mt-1">
                                                        Hiện tại bạn đang xem danh sách tổng hợp. Chức năng đánh giá trực tiếp (Submit Review) sẽ được tích hợp trong bản cập nhật tới.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- INVITATIONS MANAGEMENT VIEW --- */}
                {viewMode === 'invitations' && (
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm overflow-hidden animate-fade-in">
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
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                Không có lời mời nào.
                                            </td>
                                        </tr>
                                    ) : (
                                        invitations.map(inv => (
                                            <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-medium">{inv.conferenceName || inv.conferenceId}</span>
                                                    <div className="text-xs text-gray-400 mt-0.5">{inv.conferenceId}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {inv.status === 'Pending' && <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">Chờ phản hồi</span>}
                                                    {inv.status === 'Accepted' && <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">Đã tham gia</span>}
                                                    {inv.status === 'Declined' && <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">Đã từ chối</span>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{inv.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.sentAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                    {inv.status === 'Pending' ? (
                                                        <>
                                                            <button onClick={() => handleRespond(inv, true)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Chấp nhận">
                                                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                            </button>
                                                            <button onClick={() => handleRespond(inv, false)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Từ chối">
                                                                <span className="material-symbols-outlined text-[20px]">cancel</span>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="w-[60px]"></span> // Spacer
                                                    )}

                                                    <div className="h-5 border-l border-gray-300 mx-1"></div>

                                                    <button
                                                        onClick={() => handleDeleteInvitation(inv.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Xóa lời mời này"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
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