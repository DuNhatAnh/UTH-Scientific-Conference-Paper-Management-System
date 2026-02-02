import React, { useEffect, useState } from "react";
import { paperApi } from "../../services/paper";

interface SubmissionListProps {
  conferenceId: string;
}

interface Submission {
  id: string;
  title: string;
  status: string;
  submissionDate: string;
  authors: Array<{
    fullName: string;
    email: string;
    affiliation?: string;
  }>;
  paperNumber?: number;
  fileId?: string;
  fileName?: string;
}

export const SubmissionList: React.FC<SubmissionListProps> = ({
  conferenceId,
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "under-review" | "decided"
  >("all");
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState<{ [key: string]: number }>({
    all: 0,
    pending: 0,
    underReview: 0,
    decided: 0,
  });

  useEffect(() => {
    loadSubmissions();
  }, [conferenceId, activeTab, page]);

  const handleDownload = async (fileId: string, fileName: string, submissionId: string) => {
    try {
      const response = await paperApi.downloadFile(submissionId, fileId);
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

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const getStatusFromTab = (tab: string) => {
        switch (tab) {
          case "pending": return "SUBMITTED";
          case "under-review": return "UNDER_REVIEW";
          case "decided": return "ACCEPTED,REJECTED,REVISION";
          case "revision": return "REVISION";
          default: return undefined;
        }
      };

      const status = activeTab === "all" ? undefined : getStatusFromTab(activeTab);
      console.log(`Loading submissions for conference: ${conferenceId}, status: ${status}`);
      const response = await paperApi.getConferenceSubmissions(
        conferenceId,
        status,
        page,
        10,
      );
      console.log("Submissions response:", response);
      if (response?.success && response.data?.items) {
        console.log(`Found ${response.data.items.length} submissions`);
        setSubmissions(response.data.items);

        // Update counts if loading 'all' or just set them from response total if available
        // For simplicity, if we are on 'all' tab, we can calculate all counts
        if (activeTab === "all") {
          const items = response.data.items as Submission[];
          const cByStatus = (st: string) =>
            items.filter((s) => s.status?.toUpperCase() === st.toUpperCase())
              .length;

          setCounts({
            all: response.data.totalCount || items.length,
            pending: cByStatus("SUBMITTED"),
            underReview: cByStatus("UNDER_REVIEW"),
            decided:
              cByStatus("ACCEPTED") +
              cByStatus("REJECTED") +
              cByStatus("REVISION"),
          });
        } else {
          // If on a specific tab, update only that tab's count from the totalCount
          setCounts((prev) => ({
            ...prev,
            [activeTab === "under-review" ? "underReview" : activeTab]:
              response.data.totalCount || response.data.items.length,
          }));
        }
      } else {
        console.warn("No submissions found or request failed", response);
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Failed to load submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case "SUBMITTED":
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "UNDER_REVIEW":
      case "UNDERREVIEW":
        return "bg-blue-100 text-blue-700";
      case "ACCEPTED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "REVISION":
        return "bg-orange-100 text-orange-700";
      case "WITHDRAWN":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case "SUBMITTED":
        return "Chờ Review";
      case "PENDING":
        return "Chờ Review";
      case "UNDER_REVIEW":
      case "UNDERREVIEW":
        return "Đang Review";
      case "ACCEPTED":
        return "Được Chấp Nhận";
      case "REJECTED":
        return "Bị Từ Chối";
      case "REVISION":
        return "Cần Chỉnh Sửa";
      case "WITHDRAWN":
        return "Đã Rút";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime()) || date.getFullYear() < 1900) return "N/A";
      return date.toLocaleDateString("vi-VN");
    } catch {
      return "N/A";
    }
  };

  const countByStatus = (status: string) => {
    return submissions.filter(
      (sub) => sub.status?.toUpperCase() === status.toUpperCase(),
    ).length;
  };

  const tabs = [
    { id: "all", label: `Tất cả (${counts.all})` },
    { id: "pending", label: `Chờ Review (${counts.pending})` },
    {
      id: "under-review",
      label: `Đang Review (${counts.underReview})`,
    },
    {
      id: "decided",
      label: `Đã Quyết Định (${counts.decided})`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setPage(1);
            }}
            className={`px-4 py-3 font-medium text-sm transition-colors ${activeTab === tab.id
              ? "text-primary border-b-2 border-primary"
              : "text-gray-600 hover:text-primary"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Không có bài nộp</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Số TT</th>
                <th className="p-4">Tiêu Đề</th>
                <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200">Ngày nộp</th>
                <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200">Trạng thái</th>
                <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-200">Chức năng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="p-4 font-medium text-primary">
                    {submission.paperNumber || "-"}
                  </td>
                  <td className="p-4 text-gray-800 dark:text-gray-200">
                    <div className="font-medium max-w-xs">{submission.title}</div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    {formatDate(submission.submissionDate)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        submission.status,
                      )}`}
                    >
                      {getStatusText(submission.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {(() => {
                        const fileId = submission.fileId || (submission as any).FileId || (submission as any).files?.[0]?.fileId || (submission as any).files?.[0]?.id;
                        const fileName = submission.fileName || (submission as any).FileName || (submission as any).files?.[0]?.fileName || "paper.pdf";

                        if (fileId) {
                          return (
                            <button
                              onClick={() => handleDownload(fileId, fileName, submission.id)}
                              className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark font-medium text-xs transition-colors p-1.5 hover:bg-primary/10 rounded"
                              title="Tải bài báo"
                            >
                              <span className="material-symbols-outlined text-lg">download</span>
                              Tải bài
                            </button>
                          );
                        }
                        return <span className="text-gray-400 italic text-xs">N/A</span>;
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table >
        </div >
      )}
    </div >
  );
};
