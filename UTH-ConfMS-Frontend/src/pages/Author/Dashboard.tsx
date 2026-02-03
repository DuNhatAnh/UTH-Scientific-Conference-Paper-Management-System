import React, { useEffect, useState } from "react";
import { ViewState } from "../../App";
import { AIBadge } from "../../components/AIBadge";
import { paperApi, PaperResponse } from "../../services/paper";

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  onViewPaper?: (id: string) => void;
  onEditPaper?: (id: string) => void;
}

export const AuthorDashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onViewPaper,
  onEditPaper,
}) => {
  const [submissions, setSubmissions] = useState<PaperResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [conferences, setConferences] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [papersData, confsData] = await Promise.all([
          paperApi.getMyPapers(),
          // Use any available conference API to get deadlines
          // Assuming conferenceApi is available like in SubmitPaper
          import("../../services/conferenceApi").then(m => m.default.getConferences())
        ]);

        setSubmissions(Array.isArray(papersData) ? papersData : []);

        if (confsData.success && confsData.data) {
          // @ts-ignore - Backend response varies
          const list = confsData.data.items || confsData.data.data || confsData.data || [];
          setConferences(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDeadline = (conferenceId: string) => {
    const conf = conferences.find(c => c.conferenceId === conferenceId);
    return conf?.submissionDeadline;
  };

  const isDeadlinePassed = (conferenceId: string) => {
    const deadline = getDeadline(conferenceId);
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate.getFullYear() < 1900) return false;
    return deadlineDate < new Date();
  };

  const handleCameraReadyUpload = async (id: string, file: File) => {
    try {
      setLoading(true);
      await paperApi.uploadCameraReady(id, file);
      // Reload papers
      const papersData = await paperApi.getMyPapers();
      setSubmissions(Array.isArray(papersData) ? papersData : []);
      alert("Đã nộp bản Camera-ready thành công.");
    } catch (error) {
      console.error("Failed to upload camera-ready:", error);
      alert("Có lỗi xảy ra khi nộp bản Camera-ready.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    const reason = window.prompt("Vui lòng nhập lý do rút bài:");
    if (reason) {
      try {
        await paperApi.withdrawPaper(id, reason);
        // Remove withdrawn submission from state
        setSubmissions(submissions.filter((s) => s.id !== id));
        alert("Đã rút bài thành công.");
      } catch (error) {
        console.error("Failed to withdraw submission:", error);
        alert("Có lỗi xảy ra khi rút bài.");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
        return (
          <span className="inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 whitespace-nowrap">
            Đã nộp
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-700 whitespace-nowrap">
            Đang phản biện
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-700 whitespace-nowrap">
            Được chấp nhận
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 whitespace-nowrap">
            Bị từ chối
          </span>
        );
      case "revision_required":
        return (
          <span className="inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 whitespace-nowrap">
            Cần chỉnh sửa
          </span>
        );
      case "camera_ready":
        return (
          <span className="inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 whitespace-nowrap">
            Bản hoàn thiện (Camera-ready)
          </span>
        );
      case "finalized":
        return (
          <span className="inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 whitespace-nowrap">
            Đã chốt kỷ yếu
          </span>
        );
      case "withdrawn":
        return (
          <span className="inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 whitespace-nowrap">
            Đã rút bài
          </span>
        );
      default:
        return (
          <span className="inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
      <div className="w-full max-w-[1200px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
              Trang Tác Giả
            </h1>
            <p className="text-sm text-text-sec-light">
              Quản lý các bài báo đã nộp của bạn
            </p>
          </div>
          <button
            onClick={() => onNavigate("submit-paper")}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover shadow-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>{" "}
            Nộp bài mới
          </button>
        </div>

        {/* Submissions List */}
        <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-sec-light">
              Đang tải dữ liệu...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-text-sec-light uppercase border-b border-border-light">
                      <th className="p-4 font-bold">ID</th>
                      <th className="p-4 font-bold">Tiêu đề bài báo</th>
                      <th className="p-4 font-bold">Chủ đề</th>
                      <th className="p-4 font-bold">Trạng thái</th>
                      <th className="p-4 font-bold">Ngày nộp</th>
                      <th className="p-4 font-bold">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light text-sm">
                    {submissions.length > 0 ? (
                      submissions.map((sub) => (
                        <tr
                          key={sub.id}
                          className="hover:bg-background-light dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="p-4 font-mono text-xs" title={sub.id}>
                            {String(sub.paperNumber || 0).padStart(3, "0")}
                          </td>
                          <td
                            className="p-4 font-medium max-w-xs truncate"
                            title={sub.title}
                          >
                            {sub.title}
                          </td>
                          <td className="p-4">{sub.trackName || "N/A"}</td>
                          <td className="p-4 flex flex-col gap-1">
                            {getStatusBadge(sub.status)}
                            {sub.status === "accepted" && (
                              <div className="mt-1">
                                <AIBadge label="AI Checked" size="sm" />
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-text-sec-light">
                            {(() => {
                              try {
                                if (!sub.submissionDate) return "N/A";
                                const date = new Date(sub.submissionDate);
                                if (isNaN(date.getTime()) || date.getFullYear() < 1900) {
                                  return "N/A";
                                }
                                return date.toLocaleDateString("vi-VN");
                              } catch {
                                return "N/A";
                              }
                            })()}
                          </td>
                          <td className="p-4 flex items-center">
                            <button
                              onClick={() => onViewPaper && onViewPaper(sub.id)}
                              className="text-primary font-medium hover:underline text-xs mr-3"
                            >
                              Xem
                            </button>
                            {sub.status.toLowerCase() !== "withdrawn" &&
                              sub.status.toLowerCase() !== "accepted" &&
                              sub.status.toLowerCase() !== "rejected" &&
                              sub.status.toLowerCase() !== "finalized" && (
                                <button
                                  onClick={() => onEditPaper && onEditPaper(sub.id)}
                                  disabled={isDeadlinePassed(sub.conferenceId)}
                                  className={`font-medium hover:underline text-xs mr-3 ${isDeadlinePassed(sub.conferenceId)
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-blue-600"
                                    }`}
                                  title={isDeadlinePassed(sub.conferenceId) ? "Hết hạn nộp bài" : ""}
                                >
                                  Sửa
                                </button>
                              )}
                            {sub.status.toLowerCase() !== "withdrawn" &&
                              sub.status.toLowerCase() !== "accepted" &&
                              sub.status.toLowerCase() !== "rejected" &&
                              sub.status.toLowerCase() !== "finalized" && (
                                <button
                                  onClick={() => handleWithdraw(sub.id)}
                                  disabled={isDeadlinePassed(sub.conferenceId)}
                                  className={`font-medium hover:underline text-xs ${isDeadlinePassed(sub.conferenceId)
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-text-sec-light hover:text-red-500"
                                    }`}
                                  title={isDeadlinePassed(sub.conferenceId) ? "Hết hạn nộp bài" : ""}
                                >
                                  Rút bài
                                </button>
                              )}
                            {sub.status.toLowerCase() === "accepted" && (
                              <>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => onNavigate("decision")}
                                    className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-1.5 px-3 rounded text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                    Xem kết quả
                                  </button>
                                  <label className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-3 rounded text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-purple-200">
                                    <span className="material-symbols-outlined text-sm">upload_file</span>
                                    Nộp Camera-ready
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept=".pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleCameraReadyUpload(sub.id, file);
                                      }}
                                    />
                                  </label>
                                </div>
                              </>
                            )}
                            {sub.status.toLowerCase() === "camera_ready" && (
                              <div className="flex flex-col gap-1 items-center">
                                <span className="bg-purple-50 text-purple-600 text-[10px] font-black px-3 py-1 rounded-full border border-purple-100 italic">
                                  Đang chờ duyệt
                                </span>
                                <label className="text-purple-400 hover:text-purple-600 text-[10px] font-bold cursor-pointer underline decoration-dotted">
                                  Nộp bản thay thế
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleCameraReadyUpload(sub.id, file);
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                            {sub.status.toLowerCase() === "finalized" && (
                              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                <span className="material-symbols-outlined text-sm font-black">verified</span>
                                <span className="text-[10px] font-black uppercase">Đã vào kỷ yếu</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-text-sec-light"
                        >
                          Chưa có bài báo nào được nộp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-border-light bg-gray-50 dark:bg-gray-800 text-xs text-center text-text-sec-light">
                Hiển thị {submissions.length} bài báo
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
