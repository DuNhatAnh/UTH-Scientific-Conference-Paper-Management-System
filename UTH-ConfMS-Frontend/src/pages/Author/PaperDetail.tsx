import React, { useEffect, useState } from "react";
import { ViewState } from "../../App";
import { paperApi, PaperResponse } from "../../services/paper";

interface PaperDetailProps {
  paperId: string | null;
  onNavigate: (view: ViewState) => void;
}

export const PaperDetail: React.FC<PaperDetailProps> = ({
  paperId,
  onNavigate,
}) => {
  const [paper, setPaper] = useState<PaperResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (!paperId) {
      setError("Không tìm thấy ID bài báo.");
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const data = await paperApi.getPaperDetail(paperId);
        if (data) {
          setPaper(data.data || null);
        } else {
          setError("Không tìm thấy thông tin bài báo.");
        }
      } catch (err) {
        console.error("Failed to fetch paper detail:", err);
        setError("Có lỗi xảy ra khi tải thông tin bài báo.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [paperId]);

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
        return "Đã nộp";
      case "under_review":
      case "under review":
        return "Đang phản biện";
      case "accepted":
        return "Được chấp nhận";
      case "rejected":
        return "Bị từ chối";
      case "revision":
      case "revision_required":
        return "Cần chỉnh sửa";
      case "camera_ready":
        return "Bản hoàn thiện (Camera-ready)";
      case "finalized":
        return "Đã chốt kỷ yếu";
      case "withdrawn":
        return "Đã rút bài";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
        return "bg-blue-100 text-blue-700";
      case "under_review":
      case "under review":
        return "bg-yellow-100 text-yellow-700";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "revision":
      case "revision_required":
        return "bg-orange-100 text-orange-700";
      case "camera_ready":
        return "bg-purple-100 text-purple-700";
      case "finalized":
        return "bg-indigo-100 text-indigo-700";
      case "withdrawn":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-blue-50 text-blue-700";
    }
  };

  const handleCameraReadyUpload = async (file: File) => {
    if (!paper || !paper.id) return;
    try {
      setIsPreviewLoading(true);
      await paperApi.uploadCameraReady(paper.id, file);
      // Reload paper details
      const response = await paperApi.getPaperDetail(paper.id);
      if (response && response.data) setPaper(response.data);
      alert("Đã nộp bản Camera-ready thành công.");
    } catch (error) {
      console.error("Failed to upload camera-ready:", error);
      alert("Có lỗi xảy ra khi nộp bản Camera-ready.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!paper || !paper.id) return;

    if (!paper.files || paper.files.length === 0) {
      alert("Không tìm thấy file để tải.");
      return;
    }

    const fileToDownload = paper.files[0];

    try {
      const response = await paperApi.downloadFile(paper.id, fileToDownload.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName =
        fileToDownload.fileName || paper.fileName || `paper-${paper.id}.pdf`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Không thể tải file. Vui lòng thử lại sau.");
    }
  };

  const handlePreview = async () => {
    if (!paper || !paper.id || !paper.files || paper.files.length === 0) {
      alert("Không tìm thấy file để xem trước.");
      return;
    }

    if (previewUrl) {
      setPreviewUrl(null); // Toggle off
      return;
    }

    setIsPreviewLoading(true);
    try {
      const fileToPreview = paper.files[0];
      const response = await paperApi.downloadFile(paper.id, fileToPreview.id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
    } catch (error) {
      console.error("Preview failed:", error);
      alert("Không thể xem trước file. Vui lòng tải về máy.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (loading)
    return <div className="p-10 text-center">Đang tải thông tin...</div>;
  if (error)
    return (
      <div className="p-10 text-center text-red-500">
        {error} <br />{" "}
        <button
          onClick={() => onNavigate("author-dashboard")}
          className="text-blue-500 underline mt-2"
        >
          Quay lại
        </button>
      </div>
    );
  if (!paper) return null;

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-10 px-5 flex justify-center">
      <div className="w-full max-w-[800px] bg-white dark:bg-card-dark p-8 rounded-xl border border-border-light shadow-sm">
        <div className="flex justify-between items-start mb-6 border-b border-border-light pb-4">
          <h1 className="text-2xl font-bold text-primary">{paper.title}</h1>
          <button
            onClick={() => onNavigate("author-dashboard")}
            className="text-text-sec-light hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm text-text-sec-light uppercase">
                Tóm tắt (Abstract)
              </h3>
              <span className="text-xs font-mono text-text-sec-light bg-gray-100 px-2 py-1 rounded">
                ID: {String(paper.paperNumber || 0).padStart(3, "0")}
              </span>
            </div>
            <p className="text-text-main-light dark:text-text-main-dark leading-relaxed whitespace-pre-line">
              {paper.abstract}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold text-sm text-text-sec-light uppercase mb-1">
                Chủ đề (Track)
              </h3>
              <p className="font-medium">{paper.trackName || "N/A"}</p>
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-sec-light uppercase mb-1">
                Trạng thái
              </h3>
              <span className={`inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold uppercase whitespace-nowrap ${getStatusColor(paper.status)}`}>
                {getStatusLabel(paper.status)}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-sec-light uppercase mb-1">
                Ngày nộp
              </h3>
              <p>
                {(() => {
                  try {
                    if (!paper.submissionDate) return "N/A";
                    const date = new Date(paper.submissionDate);
                    if (isNaN(date.getTime()) || date.getFullYear() < 1900) {
                      return "N/A";
                    }
                    return date.toLocaleDateString("vi-VN");
                  } catch {
                    return "N/A";
                  }
                })()}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-sec-light uppercase mb-1">
                File đính kèm
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <span className="material-symbols-outlined">download</span>
                  Tải xuống
                </button>
                <button
                  onClick={handlePreview}
                  disabled={isPreviewLoading}
                  className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
                >
                  <span className="material-symbols-outlined">visibility</span>
                  {isPreviewLoading ? "Đang tải..." : previewUrl ? "Đóng xem trước" : "Xem trước"}
                </button>
              </div>
            </div>
            {paper.status.toLowerCase() === "accepted" && (
              <div>
                <h3 className="font-bold text-sm text-text-sec-light uppercase mb-1">
                  Bản hoàn thiện
                </h3>
                <label className="flex items-center gap-2 text-purple-600 hover:underline font-medium cursor-pointer">
                  <span className="material-symbols-outlined">upload_file</span>
                  Nộp Camera-ready
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCameraReadyUpload(file);
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          {previewUrl && (
            <div className="mt-4 border border-border-light rounded-lg overflow-hidden h-[500px]">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Paper Preview"
              ></iframe>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border-light flex justify-end gap-3">
            <button
              onClick={() => onNavigate("author-dashboard")}
              className="px-4 py-2 rounded border border-border-light hover:bg-gray-100 font-medium"
            >
              Đóng
            </button>
            {/* Edit button could go here if status allows */}
          </div>
        </div>
      </div>
    </div>
  );
};
