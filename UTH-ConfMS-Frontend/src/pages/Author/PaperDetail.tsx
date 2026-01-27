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

  const handleDownload = async () => {
    if (!paper || !paper.id) return;

    // Check if files exist
    if (!paper.files || paper.files.length === 0) {
      alert("Không tìm thấy file để tải.");
      return;
    }

    // Assuming obtaining the first file for now, or finding one that matches fileName
    // Backend FilesController: [HttpGet("{fileId:guid}/download")]
    const fileToDownload = paper.files[0];

    try {
      const response = await paperApi.downloadFile(paper.id, fileToDownload.id);
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Use fileName from file info or paper
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
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-sm">
                {paper.status}
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
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <span className="material-symbols-outlined">description</span>
                {paper.files && paper.files.length > 0
                  ? "Tải file xuống"
                  : paper.fileName || "Tải file xuống"}
              </button>
            </div>
          </div>

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
