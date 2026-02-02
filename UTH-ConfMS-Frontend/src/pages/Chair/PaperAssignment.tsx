import React, { useEffect, useState } from "react";
import { paperApi } from "../../services/paper";
import conferenceApi, { CommitteeMemberDto } from "../../services/conferenceApi";
import { reviewerApi } from "../../services/reviewerApi";
import reviewApi from "../../services/reviewApi";
import apiClient from "../../services/apiClient";

interface PaperAssignmentProps {
    conferenceId: string;
    submissionDeadline?: string;
    onSwitchTab?: (tab: any) => void;
}

interface Submission {
    id: string;
    title: string;
    paperNumber?: number;
    authors: any[];
}

export const PaperAssignment: React.FC<PaperAssignmentProps> = ({ conferenceId, submissionDeadline, onSwitchTab }) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [members, setMembers] = useState<CommitteeMemberDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPaper, setSelectedPaper] = useState<Submission | null>(null);
    const [assignedReviewers, setAssignedReviewers] = useState<any[]>([]);
    const [assigning, setAssigning] = useState(false);

    // Check if deadline passed
    const isDeadlinePassed = submissionDeadline ? new Date(submissionDeadline) < new Date() : true;

    useEffect(() => {
        loadData();
    }, [conferenceId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const subRes = await paperApi.getConferenceSubmissions(conferenceId);
            if (subRes?.success && subRes.data?.items) {
                setSubmissions(subRes.data.items);
            }

            // Using reviewerApi for consistency with PCMemberManagement
            const memRes = await (reviewerApi as any).getReviewers(conferenceId);
            if (Array.isArray(memRes)) {
                setMembers(memRes);
            } else if ((memRes as any).success && (memRes as any).data) {
                setMembers((memRes as any).data);
            } else if ((memRes as any).data) {
                setMembers((memRes as any).data);
            }
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPaper = async (paper: Submission) => {
        setSelectedPaper(paper);
        try {
            // Fetch currently assigned reviewers for this paper
            const res = await apiClient.get(`/api/assignments/paper/${paper.id}`);
            if (res.data) {
                setAssignedReviewers(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch assignments", error);
            setAssignedReviewers([]);
        }
    };

    const handleAssign = async (member: CommitteeMemberDto) => {
        if (!selectedPaper) return;

        if (!isDeadlinePassed) {
            if (!window.confirm("CẢNH BÁO: Hạn nộp bài chưa kết thúc. Việc phân công sớm có thể gây mất công bằng nếu tác giả chỉnh sửa bài nộp. Bạn vẫn muốn tiếp tục?")) {
                return;
            }
        }

        setAssigning(true);
        try {
            const payload = {
                paperId: selectedPaper.id,
                reviewerUserId: member.userId, // Send userId (Guid) for proper assignment
                reviewerEmail: member.email,
                reviewerId: 0
            };

            const res = await apiClient.post('/api/assignments', payload);
            if (res.status === 200 || res.status === 201) {
                alert(`Đã phân công ${member.fullName} cho bài báo #${selectedPaper.paperNumber}`);
                // Refresh assigned list
                handleSelectPaper(selectedPaper);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Lỗi phân công");
        } finally {
            setAssigning(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Đang tải dữ liệu...</div>;

    return (
        <div className="flex flex-col gap-4">
            {/* Deadline Warning Banner */}
            {!isDeadlinePassed && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm flex items-center gap-3 animate-fade-in">
                    <span className="material-symbols-outlined text-yellow-600">warning</span>
                    <div className="text-sm text-yellow-800">
                        <span className="font-bold">Lưu ý:</span> Hạn nộp bài chưa kết thúc (Hạn: {new Date(submissionDeadline!).toLocaleDateString("vi-VN")}).
                        Chuyên gia khuyến nghị anh nên bắt đầu phân công sau ngày này để đảm bảo bài nộp của tác giả đã là bản cuối cùng.
                    </div>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Paper List */}
                <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-gray-50 border-b font-bold flex justify-between items-center">
                        <span>Danh Sách Bài Nộp ({submissions.length})</span>
                    </div>
                    <div className="overflow-y-auto max-h-[600px]">
                        {submissions.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 italic">Chưa có bài nộp nào được gửi.</div>
                        ) : (
                            <ul className="divide-y">
                                {submissions.map((sub) => (
                                    <li
                                        key={sub.id}
                                        className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selectedPaper?.id === sub.id ? 'bg-blue-50 border-l-4 border-primary' : ''}`}
                                        onClick={() => handleSelectPaper(sub)}
                                    >
                                        <div className="font-bold text-sm">#{sub.paperNumber} {sub.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">{sub.authors.length} tác giả</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Right: Assignment Detail */}
                <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm flex flex-col min-h-[400px]">
                    {selectedPaper ? (
                        <>
                            <div className="p-4 bg-primary text-white font-bold rounded-t-xl flex justify-between items-center shadow-md">
                                <span className="truncate">Phân công cho: {selectedPaper.title}</span>
                                <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded">ID: #{selectedPaper.paperNumber}</span>
                            </div>
                            <div className="p-6 flex flex-col gap-6">
                                {/* Currently Assigned */}
                                <div>
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-700">
                                        <span className="material-symbols-outlined text-green-600">check_circle</span>
                                        Reviewers Đã Phân Công
                                    </h4>
                                    {assignedReviewers.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded border border-dashed text-center">Chưa có ai được phân công bài này.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {assignedReviewers.map((a, i) => (
                                                <li key={i} className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-100 animate-slide-in">
                                                    <span className="text-sm font-medium">{a.reviewerName}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${a.status === 'Accepted' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-yellow-200 text-yellow-700'}`}>
                                                        {a.status === 'Accepted' ? 'Đã nhận' : 'Đang chờ'}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <hr className="border-border-light" />

                                {/* Available Reviewers */}
                                <div>
                                    <div
                                        className="flex justify-between items-center mb-3 group cursor-pointer"
                                        onClick={() => onSwitchTab?.('pc')}
                                    >
                                        <h4 className="text-sm font-bold flex items-center gap-2 text-gray-700 group-hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-primary">person_add</span>
                                            Hội Đồng Chương Trình (PC Members)
                                        </h4>
                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-sm transition-all group-hover:translate-x-1">arrow_forward</span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {members.length === 0 ? (
                                            <div
                                                className="p-6 text-center bg-gray-50 rounded border-2 border-dashed border-gray-200 hover:border-primary hover:bg-blue-50 transition-all cursor-pointer"
                                                onClick={() => onSwitchTab?.('pc')}
                                            >
                                                <p className="text-xs text-gray-500 mb-1">Chưa có Reviewer nào trong Hội đồng.</p>
                                                <p className="text-sm text-primary font-bold underline flex items-center justify-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                                    Mời Reviewer ngay
                                                </p>
                                            </div>
                                        ) : (
                                            <ul className="space-y-2">
                                                {members.map((m) => {
                                                    const isAssigned = assignedReviewers.some(a => a.reviewerName === m.fullName);
                                                    return (
                                                        <li key={m.memberId || (m as any).id} className="flex justify-between items-center p-3 border rounded hover:border-primary hover:bg-blue-50/30 transition-all shadow-sm bg-white">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold">{m.fullName}</span>
                                                                <span className="text-[10px] text-gray-500">{m.email}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAssign(m)}
                                                                disabled={isAssigned || assigning}
                                                                className={`text-xs px-4 py-2 rounded-lg font-bold transition-all ${isAssigned ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-hover shadow-lg hover:shadow-primary/30'}`}
                                                            >
                                                                {isAssigned ? 'Đã gán' : 'Phân công'}
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 animate-fade-in">
                            <span className="material-symbols-outlined text-[64px] mb-4 opacity-20">move_item</span>
                            <p className="max-w-[200px] text-sm leading-relaxed italic">Chọn một bài báo từ danh sách bên trái để bắt đầu quy trình phân công.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
