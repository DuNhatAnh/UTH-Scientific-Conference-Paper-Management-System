
import React, { useState, useEffect } from 'react';
import { PDFPreview } from '../../components/PDFPreview';
import { AIBadge } from '../../components/AIBadge';
import { ReviewForm } from '../../components/ReviewForm';
import { reviewerApi, ReviewerInvitationDto } from '../../services/reviewerApi';
import { reviewApi, ReviewAssignmentDto } from '../../services/reviewApi';

export const ReviewerDashboard: React.FC = () => {
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
    const [invitations, setInvitations] = useState<ReviewerInvitationDto[]>([]);
    const [showInvitations, setShowInvitations] = useState(false);
    const [assignments, setAssignments] = useState<ReviewAssignmentDto[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);

    const fetchInvitations = async () => {
        try {
            const resp = await reviewerApi.getMyInvitations();
            // apiClient returns ApiResponse wrapper; some endpoints return raw arrays in this project
            const data = (resp as any).data ?? (resp as any);
            setInvitations(data);
        } catch (err) {
            console.error('Failed to load invitations', err);
        }
    };

    const fetchAssignments = async () => {
        setLoadingAssignments(true);
        try {
            const resp = await reviewApi.getMyAssignments();
            // Xử lý response trả về từ API (có thể bọc trong ApiResponse hoặc không)
            const data = Array.isArray(resp) ? resp : (resp as any).data || [];
            setAssignments(data);
        } catch (err) {
            console.error('Failed to load assignments', err);
        } finally {
            setLoadingAssignments(false);
        }
    };

    useEffect(() => {
        // Load invitations once when dashboard mounts
        fetchInvitations();
        fetchAssignments();
    }, []);

    // Xử lý chấp nhận phân công
    const handleAcceptAssignment = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); // Ngăn không cho click vào card (mở form review)
        if (!window.confirm('Bạn có chắc chắn muốn chấp nhận đánh giá bài báo này?')) return;
        
        try {
            await reviewApi.acceptAssignment(id);
            fetchAssignments(); // Tải lại danh sách
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi chấp nhận phân công.');
        }
    };

    // Xử lý từ chối phân công
    const handleDeclineAssignment = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const reason = window.prompt('Vui lòng nhập lý do từ chối:');
        if (reason === null) return; // Người dùng bấm Cancel

        try {
            await reviewApi.declineAssignment(id, reason);
            fetchAssignments();
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi từ chối phân công.');
        }
    };

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Paper List */}
            <div className={`lg:col-span-${selectedPaper ? '1' : '3'} flex flex-col gap-4 transition-all`}>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-2">Bài được phân công</h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setShowInvitations(!showInvitations); if (!showInvitations) fetchInvitations(); }}
                            className="px-3 py-1 bg-primary hover:bg-primary-hover text-white font-medium rounded-md shadow-sm transition flex items-center gap-2"
                            aria-label="Lời mời phân công"
                        >
                            <span className="material-symbols-outlined">assignment</span>
                            Lời mời phân công {invitations.filter(i => i.status === 'Pending').length > 0 && (
                                <span className="ml-2 text-sm text-white bg-red-600 px-2 py-0.5 rounded">{invitations.filter(i => i.status === 'Pending').length}</span>
                            )}
                        </button>
                    </div>
                </div>

                {showInvitations && (
                    <div className="mb-4 p-4 bg-white dark:bg-card-dark border border-border-light rounded-lg">
                        <h3 className="font-semibold mb-2">Lời mời phân công của bạn</h3>
                        {invitations.length === 0 && <p className="text-sm text-text-sec-light">Không có lời mời nào.</p>}
                        {invitations.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                                <div>
                                    <div className="font-medium">{inv.fullName}</div>
                                    <div className="text-xs text-text-sec-light">{inv.email} • {new Date(inv.sentAt).toLocaleString()}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {inv.status === 'Pending' ? (
                                        <>
                                            <button onClick={async () => { await reviewerApi.respondInvitation({ token: inv.token ?? '', isAccepted: true }); await fetchInvitations(); }} className="px-3 py-1 bg-green-500 text-white rounded">Chấp nhận</button>
                                            <button onClick={async () => { await reviewerApi.respondInvitation({ token: inv.token ?? '', isAccepted: false }); await fetchInvitations(); }} className="px-3 py-1 bg-red-500 text-white rounded">Từ chối</button>
                                        </>
                                    ) : (
                                        <span className="text-sm text-text-sec-light">{inv.status}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {loadingAssignments && (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loadingAssignments && assignments.length === 0 && (
                    <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-border-light">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">assignment_late</span>
                        <p className="text-text-sec-light">Bạn chưa được phân công bài báo nào.</p>
                    </div>
                )}

                {/* Real Data List */}
                {!loadingAssignments && assignments.map((assignment) => (
                    <div 
                        key={assignment.id} 
                        onClick={() => {
                            // Chỉ cho phép mở form review nếu đã chấp nhận hoặc đã hoàn thành
                            if (assignment.status === 'Accepted' || assignment.status === 'Completed') {
                                setSelectedPaper(assignment.paperId || assignment.id.toString());
                            }
                        }} 
                        className={`bg-white dark:bg-card-dark p-5 rounded-xl border transition-all hover:shadow-md 
                            ${(assignment.status === 'Accepted' || assignment.status === 'Completed') ? 'cursor-pointer border-blue-200' : 'cursor-default border-border-light'}
                            ${selectedPaper === assignment.paperId ? 'border-primary ring-1 ring-primary' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">#{assignment.paperId}</span>
                            <span className="text-xs font-bold text-red-500">
                                {assignment.dueDate ? `Hạn: ${new Date(assignment.dueDate).toLocaleDateString('vi-VN')}` : 'Chưa có hạn'}
                            </span>
                        </div>
                        <h3 className="font-bold text-sm mb-2 text-blue-700 dark:text-blue-400">{assignment.submissionTitle || "Đang tải tiêu đề..."}</h3>
                        <p className="text-xs text-text-sec-light line-clamp-2">{assignment.submissionAbstract || "Chưa có tóm tắt..."}</p>
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                            {/* Hiển thị trạng thái */}
                            {assignment.status === 'Pending' && (
                                <div className="flex gap-2 w-full mt-1">
                                    <button 
                                        onClick={(e) => handleAcceptAssignment(e, assignment.id)}
                                        className="flex-1 px-3 py-1.5 bg-primary text-white text-xs rounded hover:bg-primary-hover font-bold transition shadow-sm"
                                    >
                                        Chấp nhận
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeclineAssignment(e, assignment.id)}
                                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 font-bold transition"
                                    >
                                        Từ chối
                                    </button>
                                </div>
                            )}

                            {assignment.status === 'Accepted' && (
                                <span className="text-xs px-2 py-1 rounded-full font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">edit_document</span> Đang đánh giá
                                </span>
                            )}

                            {assignment.status === 'Completed' && (
                                <span className="text-xs px-2 py-1 rounded-full font-bold bg-green-100 text-green-700 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Đã hoàn thành
                                </span>
                            )}

                            {assignment.status === 'Rejected' && (
                                <span className="text-xs px-2 py-1 rounded-full font-bold bg-gray-100 text-gray-500">Đã từ chối</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Review Form (Visible when selected) */}
            {selectedPaper && (
                <div className="lg:col-span-2 bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-lg flex flex-col h-[800px] overflow-hidden">
                    <div className="p-4 border-b border-border-light flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                        <h3 className="font-bold">Đánh giá bài báo #{selectedPaper}</h3>
                        <button onClick={() => setSelectedPaper(null)} className="text-gray-400 hover:text-gray-600 material-symbols-outlined">close</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex flex-col gap-6">
                            
                            {/* PDF Preview Integration */}
                            <div className="h-64 w-full">
                                {(() => {
                                    const selectedAssignment = assignments.find(a => (a.paperId || a.id.toString()) === selectedPaper);
                                    return <PDFPreview fileName={selectedAssignment?.submissionFileName || `paper_${selectedPaper}.pdf`} />;
                                })()}
                            </div>

                            {/* Gọi Component ReviewForm tại đây */}
                            <ReviewForm paperId={selectedPaper} />
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};