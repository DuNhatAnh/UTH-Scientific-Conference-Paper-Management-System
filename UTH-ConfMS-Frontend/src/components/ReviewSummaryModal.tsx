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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Tổng hợp Review</h2>
                        <p className="text-sm text-gray-500">Paper ID: {typeof summary.paperId === 'number' ? `#${summary.paperId}` : summary.paperId}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                            <div className="text-3xl font-bold text-blue-600">{summary.overallAverageScore.toFixed(1)}</div>
                            <div className="text-xs uppercase font-bold text-blue-400 mt-1">Điểm TB Chung</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                            <div className="text-3xl font-bold text-green-600">{summary.AcceptCount}</div>
                            <div className="text-xs uppercase font-bold text-green-400 mt-1">Accept</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-center">
                            <div className="text-3xl font-bold text-yellow-600">{summary.RevisionCount}</div>
                            <div className="text-xs uppercase font-bold text-yellow-400 mt-1">Revision</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                            <div className="text-3xl font-bold text-red-600">{summary.RejectCount}</div>
                            <div className="text-xs uppercase font-bold text-red-400 mt-1">Reject</div>
                        </div>
                    </div>

                    {/* Files Section */}
                    <div className="mb-8">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-purple-600">
                            <span className="material-symbols-outlined">description</span>
                            File bài nộp (Bản mới nhất)
                        </h3>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            {summary.files && summary.files.length > 0 ? (
                                <div className="space-y-3">
                                    {summary.files.map((file) => (
                                        <div
                                            key={file.fileId}
                                            className={`flex items-center justify-between p-3 rounded border transition ${file.fileType?.toUpperCase() === "CAMERA_READY"
                                                ? "bg-purple-50 border-purple-300 shadow-sm"
                                                : "bg-white border-gray-200"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${file.fileType?.toUpperCase() === "CAMERA_READY" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-400"}`}>
                                                    <span className="material-symbols-outlined">picture_as_pdf</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-gray-800">{file.fileName}</div>
                                                        {file.fileType?.toUpperCase() === "CAMERA_READY" && (
                                                            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                                                Bản Camera-ready
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-text-sec-light">
                                                        {(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleDownload(file.fileId, file.fileName)}
                                                    className="flex items-center gap-1 text-primary hover:underline font-medium text-xs"
                                                >
                                                    <span className="material-symbols-outlined text-sm">download</span>
                                                    Tải về
                                                </button>

                                                {file.fileType?.toUpperCase() === "CAMERA_READY" && onFinalize && (
                                                    <button
                                                        onClick={() => onFinalize(summary.paperId)}
                                                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">verified_user</span>
                                                        Duyệt & Xuất kỷ yếu
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm italic text-center">Không có file đính kèm.</p>
                            )}
                        </div>
                    </div>

                    {/* Detailed Scores Table */}
                    <div className="mb-8">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">analytics</span>
                            Chi tiết điểm số
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                                    <tr>
                                        <th className="px-4 py-3">Reviewer</th>
                                        <th className="px-4 py-3 text-center">Novelty</th>
                                        <th className="px-4 py-3 text-center">Methodology</th>
                                        <th className="px-4 py-3 text-center">Presentation</th>
                                        <th className="px-4 py-3 text-center">Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {summary.reviews.map((review, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">Reviewer {idx + 1}</td>
                                            <td className="px-4 py-3 text-center">{review.noveltyScore}</td>
                                            <td className="px-4 py-3 text-center">{review.methodologyScore}</td>
                                            <td className="px-4 py-3 text-center">{review.presentationScore}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold 
                                                    ${review.recommendation?.toLowerCase() === 'accept' ? 'bg-green-100 text-green-700' :
                                                        review.recommendation?.toLowerCase() === 'reject' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {review.recommendation}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Average Row */}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="px-4 py-3">Trung bình</td>
                                        <td className="px-4 py-3 text-center text-primary">{summary.averageNoveltyScore.toFixed(1)}</td>
                                        <td className="px-4 py-3 text-center text-primary">{summary.averageMethodologyScore.toFixed(1)}</td>
                                        <td className="px-4 py-3 text-center text-primary">{summary.averagePresentationScore.toFixed(1)}</td>
                                        <td className="px-4 py-3"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Detailed Comments */}
                    <div>
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">comment</span>
                            Nhận xét chi tiết
                        </h3>
                        <div className="space-y-4">
                            {summary.reviews.map((review, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-gray-800">{review.reviewerName || `Reviewer ${review.reviewerId}`}</div>
                                        <div className="text-xs text-gray-500">{new Date(review.submittedAt).toLocaleDateString()}</div>
                                    </div>

                                    <div className="mb-3">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Nhận xét cho tác giả:</div>
                                        <div className="text-gray-700 bg-gray-50 p-3 rounded italic">"{review.commentsForAuthor}"</div>
                                    </div>

                                    {review.confidentialComments && (
                                        <div className="border-t border-dashed border-gray-200 pt-2 mt-2">
                                            <div className="text-xs font-bold text-red-500 uppercase mb-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">lock</span>
                                                Confidential Comments (Chỉ Chair/Admin):
                                            </div>
                                            <div className="text-gray-600 text-sm bg-red-50 p-3 rounded">
                                                {review.confidentialComments}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg shadow transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
