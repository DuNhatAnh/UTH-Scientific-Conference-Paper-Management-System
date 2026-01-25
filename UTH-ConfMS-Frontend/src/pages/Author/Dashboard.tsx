import React, { useEffect, useState } from "react";
import { ViewState } from "../../App";
import { AIBadge } from "../../components/AIBadge";
import { paperApi, PaperResponse } from "../../services/paper";

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  onViewPaper?: (id: string) => void;
}

export const AuthorDashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onViewPaper,
}) => {
  const [submissions, setSubmissions] = useState<PaperResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await paperApi.getMyPapers();
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

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
    switch (status) {
      case "submitted":
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            Submitted
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
            Under Review
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            Rejected
          </span>
        );
      case "revision_required":
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
            Revision Required
          </span>
        );
      case "withdrawn":
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
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
                                const date = new Date(sub.submissionDate);
                                if (isNaN(date.getTime())) {
                                  return sub.submissionDate || "N/A";
                                }
                                return date.toLocaleDateString("vi-VN");
                              } catch {
                                return sub.submissionDate || "N/A";
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
                            {sub.status !== "withdrawn" &&
                              sub.status !== "accepted" &&
                              sub.status !== "rejected" && (
                                <button
                                  onClick={() => handleWithdraw(sub.id)}
                                  className="text-text-sec-light font-medium hover:text-red-500 hover:underline text-xs"
                                >
                                  Rút bài
                                </button>
                              )}
                            {sub.status === "accepted" && (
                              <button
                                onClick={() => onNavigate("decision")}
                                className="text-primary font-medium hover:underline text-xs mr-3"
                              >
                                Kết quả
                              </button>
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
