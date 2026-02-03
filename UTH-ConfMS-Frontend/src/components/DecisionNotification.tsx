import React, { useEffect, useState } from 'react';
import { AIBadge } from './AIBadge';
import { reviewApi, ReviewSummaryDto } from '../services/reviewApi';
import { paperApi, PaperResponse } from '../services/paper';

interface DecisionNotificationProps {
  paperId: string | null;
}

export const DecisionNotification: React.FC<DecisionNotificationProps> = ({ paperId }) => {
  const [summary, setSummary] = useState<ReviewSummaryDto | null>(null);
  const [paper, setPaper] = useState<PaperResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!paperId) {
        setError("Không tìm thấy ID bài báo.");
        setLoading(false);
        return;
      }

      try {
        const [summaryRes, paperRes] = await Promise.all([
          reviewApi.getReviewSummary(paperId),
          paperApi.getPaperDetail(paperId)
        ]);

        if (summaryRes.success) {
          setSummary(summaryRes.data || null);
        }
        if (paperRes.success) {
          setPaper(paperRes.data || null);
        }
      } catch (err) {
        console.error("Failed to fetch decision data:", err);
        setError("Có lỗi xảy ra khi tải thông tin kết quả.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paperId]);

  const handleCameraReadyUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !paperId) return;

    try {
      setUploading(true);
      await paperApi.uploadCameraReady(paperId, file);
      alert("Đã nộp bản Camera-ready thành công!");
      // Reload paper to update status
      const paperRes = await paperApi.getPaperDetail(paperId);
      if (paperRes.success) setPaper(paperRes.data);
    } catch (err) {
      console.error("Failed to upload camera-ready:", err);
      alert("Có lỗi xảy ra khi nộp bản Camera-ready.");
    } finally {
      setUploading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-20 text-center">Đang tải kết quả...</div>;
  if (error || !paper) return <div className="p-20 text-center text-red-500">{error || "Không tìm thấy dữ liệu bài báo."}</div>;

  const isAccepted = paper.status.toLowerCase() === 'accepted' || paper.status.toLowerCase() === 'camera_ready' || paper.status.toLowerCase() === 'finalized';
  const isRejected = paper.status.toLowerCase() === 'rejected';
  
  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-12 px-5 flex justify-center print:bg-white print:py-0">
        <div className="w-full max-w-[800px] bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-lg overflow-hidden print:shadow-none print:border-none">
            <div className={`${isAccepted ? 'bg-green-600' : isRejected ? 'bg-red-600' : 'bg-orange-500'} p-6 text-white text-center print:text-black print:bg-white print:border-b`}>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 print:hidden">
                    <span className="material-symbols-outlined text-[32px]">
                        {isAccepted ? 'check_circle' : isRejected ? 'cancel' : 'edit_note'}
                    </span>
                </div>
                <h1 className="text-2xl font-bold">
                    {isAccepted ? 'Chúc mừng! Bài báo của bạn đã được Chấp nhận' : 
                     isRejected ? 'Rất tiếc, bài báo của bạn không được chấp nhận' : 
                     'Bài báo của bạn cần được chỉnh sửa'}
                </h1>
                <p className="opacity-90 mt-2">Mã bài báo: #{String(paper.paperNumber || 0).padStart(3, "0")}</p>
            </div>
            
            <div className="p-8">
                <div className="mb-6">
                    <h2 className="text-lg font-bold mb-2">Thông tin chi tiết</h2>
                    <p className="text-sm text-text-sec-light mb-1"><span className="font-bold text-text-main-light">Tiêu đề:</span> {paper.title}</p>
                    <p className="text-sm text-text-sec-light"><span className="font-bold text-text-main-light">Quyết định:</span> {
                        isAccepted ? 'Được chấp nhận đăng' : 
                        isRejected ? 'Bị từ chối' : 
                        'Yêu cầu chỉnh sửa'
                    }</p>
                </div>

                {summary?.chairComments && (
                    <div className="mb-8 bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
                        <div className="flex items-center gap-2 mb-2 text-blue-700">
                            <span className="material-symbols-outlined font-bold">campaign</span>
                            <h3 className="font-bold text-sm uppercase tracking-wider">Thông điệp từ Ban Tổ chức (Chair)</h3>
                        </div>
                        <p className="text-sm text-blue-900 leading-relaxed font-medium whitespace-pre-wrap">
                            {summary.chairComments}
                        </p>
                    </div>
                )}

                {summary && summary.reviews.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-border-light mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-sm">Tổng hợp đánh giá từ Hội đồng</h3>
                            <AIBadge label="AI Summarized" size="sm" />
                        </div>
                        <div className="space-y-4">
                            {summary.reviews.map((review, idx) => (
                                <div key={idx} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-primary italic">{review.reviewerName}</span>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Tính mới: {review.noveltyScore}/5</span>
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Phương pháp: {review.methodologyScore}/5</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-sec-light leading-relaxed italic">
                                        "{review.commentsForAuthor || "Không có nhận xét chi tiết."}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3 print:hidden">
                    {paper.status.toLowerCase() === 'accepted' && (
                        <label className={`w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover shadow-sm transition-colors text-center cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">upload_file</span>
                                {uploading ? 'Đang tải lên...' : 'Nộp bản Camera-ready (Phiên bản cuối cùng)'}
                            </span>
                            <input type="file" className="hidden" accept=".pdf" onChange={handleCameraReadyUpload} disabled={uploading} />
                        </label>
                    )}
                    
                    {paper.status.toLowerCase() === 'camera_ready' && (
                        <div className="w-full py-3 bg-purple-100 text-purple-700 font-bold rounded-lg text-center flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">done_all</span>
                            Đã nộp bản Camera-ready (Đang chờ duyệt kỷ yếu)
                        </div>
                    )}

                    {paper.status.toLowerCase() === 'finalized' && (
                        <div className="w-full py-3 bg-green-100 text-green-700 font-bold rounded-lg text-center flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">verified</span>
                            Bài báo đã được duyệt vào kỷ yếu chính thức
                        </div>
                    )}

                    <button 
                        onClick={handlePrint}
                        className="w-full py-3 bg-white border border-border-light text-text-main-light font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">print</span>
                        Tải về / In nhận xét chi tiết
                    </button>
                    
                    <button 
                        onClick={() => window.history.back()}
                        className="text-sm text-text-sec-light hover:text-primary mt-2"
                    >
                        Quay lại Dashboard
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
