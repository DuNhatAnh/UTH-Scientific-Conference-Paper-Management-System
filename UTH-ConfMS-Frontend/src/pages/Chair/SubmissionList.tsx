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

  useEffect(() => {
    loadSubmissions();
  }, [conferenceId, activeTab, page]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const status = activeTab === "all" ? undefined : activeTab.toUpperCase();
      const response = await paperApi.getConferenceSubmissions(
        conferenceId,
        status,
        page,
        10,
      );
      if (response?.success && response.data?.items) {
        setSubmissions(response.data.items);
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
      if (isNaN(date.getTime())) return "N/A";
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
    { id: "all", label: `Tất cả (${submissions.length})` },
    { id: "pending", label: `Chờ Review (${countByStatus("SUBMITTED")})` },
    {
      id: "under-review",
      label: `Đang Review (${countByStatus("UNDER_REVIEW")})`,
    },
    {
      id: "decided",
      label: `Đã Quyết Định (${countByStatus("ACCEPTED") + countByStatus("REJECTED")})`,
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
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === tab.id
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
                <th className="p-4">Tác Giả Chính</th>
                <th className="p-4">Ngày Nộp</th>
                <th className="p-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-medium text-primary">
                    {submission.paperNumber || "-"}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900 max-w-xs truncate">
                      {submission.title}
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium">
                        {submission.authors?.[0]?.fullName || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {submission.authors?.length
                          ? `${submission.authors.length} tác giả`
                          : "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
