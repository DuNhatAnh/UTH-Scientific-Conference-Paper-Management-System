import React, { useEffect, useState } from "react";
import { ViewState } from "../../App";
import reviewApi, {
  SubmissionForDecisionDto,
  ReviewSummaryDto,
  MakeDecisionRequest,
} from "../../services/reviewApi";
import { ReviewSummaryModal } from "../../components/ReviewSummaryModal";
import { DecisionModal } from "../../components/DecisionModal";

interface SubmissionManagementProps {
  onNavigate: (view: ViewState) => void;
  conferenceId?: string | number; // Support both for compatibility
}

export const SubmissionManagement: React.FC<SubmissionManagementProps> = ({
  onNavigate,
  conferenceId,
}) => {
  const [submissions, setSubmissions] = useState<SubmissionForDecisionDto[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // Summary Modal State
  const [selectedPaperId, setSelectedPaperId] = useState<
    string | number | null
  >(null);
  const [summaryData, setSummaryData] = useState<ReviewSummaryDto | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Decision Modal State
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [decidingPaper, setDecidingPaper] = useState<{
    id: string | number;
    title: string;
  } | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [conferenceId]);

  const loadSubmissions = async () => {
    try {
      const res = await reviewApi.getSubmissionsForDecision(conferenceId);
      if (res.success && res.data) {
        setSubmissions(res.data);
      }
    } catch (error) {
      console.error("Failed to load submissions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSummary = async (paperId: string | number) => {
    setSelectedPaperId(paperId);
    setLoadingSummary(true);
    setIsSummaryOpen(true);

    try {
      console.log(`Fetching summary for paper ${paperId}`);
      const res = await reviewApi.getReviewSummary(paperId as any);
      if (res.success && res.data) {
        setSummaryData(res.data);
      } else {
        console.error("Failed to fetch summary data");
        setSummaryData(null);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummaryData(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const closeSummary = () => {
    setIsSummaryOpen(false);
    setSummaryData(null);
    setSelectedPaperId(null);
  };

  const handleOpenDecision = (id: string | number, title: string) => {
    setDecidingPaper({ id, title });
    setIsDecisionOpen(true);
  };

  const handleSubmitDecision = async (data: MakeDecisionRequest) => {
    try {
      const res = await reviewApi.makeDecision(data);
      if (res.success) {
        alert("Đã lưu quyết định thành công!");
        loadSubmissions(); // Refresh list
      }
    } catch (error) {
      console.error("Error submitting decision:", error);
      throw error;
    }
  };

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
      <div className="w-full max-w-[1200px] flex flex-col gap-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              rate_review
            </span>
            Quản lý Bài nộp & Review
          </h1>
          <button
            onClick={() => onNavigate("chair-dashboard")}
            className="text-gray-500 hover:text-primary transition font-medium flex items-center gap-1"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border-light flex justify-between items-center bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold">Danh sách Bài nộp cần Quyết định</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Chưa có bài nộp nào đang chờ duyệt.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-border-light text-xs uppercase text-text-sec-light">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Tiêu đề</th>
                  <th className="p-3">Chủ đề</th>
                  <th className="p-3 text-center">Reviews</th>
                  <th className="p-3 text-center">Avg Score</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {submissions.map((sub) => (
                  <tr
                    key={sub.submissionId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3 text-gray-500">#{sub.submissionId}</td>
                    <td className="p-3 font-medium text-primary">
                      {sub.title}
                      <div className="text-xs text-gray-500 font-normal mt-1">
                        {sub.authors?.join(", ") || "Unknown Author"}
                      </div>
                    </td>
                    <td className="p-3">{sub.topicName || (sub as any).trackName || "N/A"}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${sub.completedReviews === sub.totalReviews ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                      >
                        {sub.completedReviews}/{sub.totalReviews}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-gray-700">
                      {sub.averageScore ? sub.averageScore.toFixed(1) : "-"}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {sub.currentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleViewSummary(sub.submissionId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded transition shadow-sm"
                      >
                        Xem Summary
                      </button>
                      <button
                        onClick={() =>
                          handleOpenDecision(sub.submissionId, sub.title)
                        }
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded transition shadow-sm"
                      >
                        Quyết định
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Review Summary Modal */}
      <ReviewSummaryModal
        isOpen={isSummaryOpen}
        onClose={closeSummary}
        summary={summaryData}
        isLoading={loadingSummary}
      />

      {/* Decision Modal */}
      {decidingPaper && (
        <DecisionModal
          isOpen={isDecisionOpen}
          onClose={() => setIsDecisionOpen(false)}
          onSubmit={handleSubmitDecision}
          paperId={decidingPaper.id}
          paperTitle={decidingPaper.title}
        />
      )}
    </div>
  );
};
