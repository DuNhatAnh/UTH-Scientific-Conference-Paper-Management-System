import React from 'react';
import { ReviewSummaryDto, ReviewDetailDto } from '../services/reviewApi';
import { paperApi } from '../services/paper';

interface ReviewSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: ReviewSummaryDto | null;
    isLoading: boolean;
    onFinalize?: (paperId: string | number) => void;
}

export const ReviewSummaryModal: React.FC<ReviewSummaryModalProps> = ({ isOpen, onClose, summary, isLoading, onFinalize }) => {
    if (!isOpen) return null;

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải tổng hợp review...</p>
                </div>
            </div>
        );
    }

    if (!summary) return null;

    const handleDownload = async (fileId: string, fileName: string) => {
        try {
            const response = await paperApi.downloadFile(summary.paperId.toString(), fileId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Không thể tải file. Vui lòng thử lại sau.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-slide-up">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">analytics</span>
                            Tổng hợp Kết quả Review
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Paper ID: <span className="text-primary font-bold">{typeof summary.paperId === 'number' ? `#${summary.paperId}` : summary.paperId}</span></p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-200 text-white transform transition hover:scale-[1.02]">
                            <div className="text-4xl font-black mb-1">{summary.overallAverageScore?.toFixed(1) || "0.0"}</div>
                            <div className="text-[10px] uppercase font-black tracking-widest opacity-80">Điểm Trung Bình Chung</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm shadow-green-100/50 flex flex-col items-center justify-center border-b-4 border-b-green-500 transform transition hover:scale-[1.02]">
                            <div className="text-3xl font-black text-green-600 mb-1">{summary.AcceptCount ?? summary.acceptCount ?? 0}</div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-green-500">Đề xuất Chấp nhận</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-yellow-100 shadow-sm shadow-yellow-100/50 flex flex-col items-center justify-center border-b-4 border-b-yellow-500 transform transition hover:scale-[1.02]">
                            <div className="text-3xl font-black text-yellow-600 mb-1">{summary.RevisionCount ?? summary.revisionCount ?? 0}</div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-yellow-500">Yêu cầu Chỉnh sửa</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm shadow-red-100/50 flex flex-col items-center justify-center border-b-4 border-b-red-500 transform transition hover:scale-[1.02]">
                            <div className="text-3xl font-black text-red-600 mb-1">{summary.RejectCount ?? summary.rejectCount ?? 0}</div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-red-500">Đề xuất Từ chối</div>
                        </div>
                    </div>

                    {/* Files Section */}
                    <div className="mb-10">
                        <h3 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-400">
                            <span className="material-symbols-outlined text-lg">folder_open</span>
                            Tài liệu & Bản thảo nộp gần nhất
                        </h3>
                        <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-2">
                            {summary.files && summary.files.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {summary.files.map((file) => (
                                        <div
                                            key={file.fileId}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                                file.fileType?.toUpperCase() === "CAMERA_READY"
                                                    ? "bg-purple-50 border-purple-200 shadow-sm ring-1 ring-purple-100"
                                                    : "bg-white border-gray-100 hover:border-primary/30"
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    file.fileType?.toUpperCase() === "CAMERA_READY" 
                                                        ? "bg-purple-100 text-purple-600" 
                                                        : "bg-blue-50 text-blue-500"
                                                }`}>
                                                    <span className="material-symbols-outlined text-2xl">
                                                        {file.fileType?.toUpperCase() === "CAMERA_READY" ? "verified" : "draft"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-bold text-gray-800">{file.fileName}</span>
                                                        {file.fileType?.toUpperCase() === "CAMERA_READY" && (
                                                            <span className="bg-purple-600 text-[10px] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                                                Camera-ready
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 font-medium">
                                                        {(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleString('vi-VN')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleDownload(file.fileId, file.fileName)}
                                                    className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold text-xs transition active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined text-lg">download</span>
                                                    Tải xuống
                                                </button>

                                                {file.fileType?.toUpperCase() === "CAMERA_READY" && onFinalize && (
                                                    <button
                                                        onClick={() => onFinalize(summary.paperId)}
                                                        className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold text-xs shadow-lg shadow-primary/20 transition active:scale-95 animate-pulse-subtle"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">verified_user</span>
                                                        Duyệt & Xuất kỷ yếu
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center flex flex-col items-center gap-2">
                                    <span className="material-symbols-outlined text-4xl text-gray-200">cloud_off</span>
                                    <p className="text-gray-400 text-sm font-medium italic">Không có tệp đính kèm nào được tìm thấy.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detailed Scores Table */}
                    <div className="mb-10">
                        <h3 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-400">
                            <span className="material-symbols-outlined text-lg">rule</span>
                            Bảng Điểm Chi Tiết
                        </h3>
                        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/80 text-[10px] uppercase text-gray-500 font-black tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Chuyên gia phản biện</th>
                                        <th className="px-4 py-4 text-center">Novelty</th>
                                        <th className="px-4 py-4 text-center">Method</th>
                                        <th className="px-4 py-4 text-center">Presen.</th>
                                        <th className="px-6 py-4 text-center">Đề nghị</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {summary.reviews.length > 0 ? summary.reviews.map((review, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-700 text-sm">Reviewer {idx + 1}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-black text-xs">
                                                    {review.noveltyScore}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-black text-xs">
                                                    {review.methodologyScore}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-black text-xs">
                                                    {review.presentationScore}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border
                                                    ${review.recommendation?.toLowerCase() === 'accept' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        review.recommendation?.toLowerCase() === 'reject' ? 'bg-red-100 text-red-700 border-red-200' : 
                                                        'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                                    {review.recommendation}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-400 italic text-sm">Chưa có kết quả đánh giá nào.</td>
                                        </tr>
                                    )}
                                    {/* Average Row */}
                                    <tr className="bg-gray-50/50 font-black border-t-2 border-gray-100">
                                        <td className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">Trung bình đạt được</td>
                                        <td className="px-4 py-4 text-center text-primary font-black">{summary.averageNoveltyScore?.toFixed(1) || "0.0"}</td>
                                        <td className="px-4 py-4 text-center text-primary font-black">{summary.averageMethodologyScore?.toFixed(1) || "0.0"}</td>
                                        <td className="px-4 py-4 text-center text-primary font-black">{summary.averagePresentationScore?.toFixed(1) || "0.0"}</td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Detailed Comments */}
                    <div>
                        <h3 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-400">
                            <span className="material-symbols-outlined text-lg">forum</span>
                            Nhận xét & Góp ý chi tiết
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {summary.reviews.length > 0 ? summary.reviews.map((review, idx) => (
                                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all duration-300 relative group">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="font-black text-gray-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                                            <span className="bg-primary text-white w-6 h-6 flex items-center justify-center rounded-lg shadow-sm">{idx + 1}</span>
                                            {review.reviewerName || `Chuyên gia ${idx + 1}`}
                                        </div>
                                        <div className="text-[11px] text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-full border border-gray-100 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                            {new Date(review.submittedAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Nhận xét gửi tác giả:</div>
                                            <div className="text-gray-700 bg-blue-50/30 p-4 rounded-xl italic leading-relaxed border-l-4 border-blue-400/30 text-sm">
                                                "{review.commentsForAuthor || "Không có nhận xét."}"
                                            </div>
                                        </div>

                                        {review.confidentialComments && (
                                            <div className="bg-red-50/30 rounded-xl p-4 border border-red-100/50">
                                                <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">lock</span>
                                                    Góp ý mật (Chỉ Hội đồng thấy):
                                                </div>
                                                <div className="text-gray-600 text-sm leading-relaxed">
                                                    {review.confidentialComments}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center flex flex-col items-center gap-3 bg-gray-50/30 rounded-3xl border border-dashed border-gray-200">
                                    <span className="material-symbols-outlined text-5xl text-gray-200">rate_review</span>
                                    <p className="text-gray-400 text-sm font-medium italic">Chưa có nhận xét nào từ chuyên gia.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm flex justify-end items-center gap-4">
                    <p className="text-xs text-gray-400 font-medium mr-auto pl-4 italic">
                        Dữ liệu được lấy trực tiếp từ các chuyên gia phản biện.
                    </p>
                    <button
                        onClick={onClose}
                        className="bg-white hover:bg-gray-100 text-gray-700 font-black py-2.5 px-8 rounded-xl border border-gray-200 shadow-sm transition-all active:scale-95 text-xs uppercase tracking-widest"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        </div>
    );
};
