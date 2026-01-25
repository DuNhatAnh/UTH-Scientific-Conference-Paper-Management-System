import React, { useEffect, useState } from "react";
import { ViewState } from "../../App";
import conferenceApi, { ConferenceDto } from "../../services/conferenceApi";
import { useAuth } from "../../contexts/AuthContext";

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  onManageConference?: (conferenceId: string) => void;
  onManagePC?: (conferenceId: string) => void;
  onManageSubmissions?: (conferenceId: string) => void;
}

export const ChairDashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onManageConference,
  onManagePC,
  onManageSubmissions,
}) => {
  const [conferences, setConferences] = useState<ConferenceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await conferenceApi.getConferences();
        if (response.success && response.data) {
          setConferences(response.data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch conferences", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConferences();
  }, []);

  const handleDeleteConference = async (
    conferenceId: string,
    conferenceName: string,
  ) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xoá hội nghị "${conferenceName}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(conferenceId);
    setDeleteError(null);

    try {
      const response = await conferenceApi.deleteConference(conferenceId);
      if (response.success) {
        setConferences(
          conferences.filter((c) => c.conferenceId !== conferenceId),
        );
        alert(`Xoá hội nghị "${conferenceName}" thành công!`);
      } else {
        setDeleteError(response.message || "Không thể xoá hội nghị");
      }
    } catch (error: any) {
      console.error("Delete conference error:", error);
      let errorMsg = "Có lỗi xảy ra khi xoá hội nghị";
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      setDeleteError(errorMsg);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
      <div className="w-full max-w-[1200px] flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
            Dashboard Trưởng Ban Chương Trình
          </h1>
          <button
            onClick={() => onNavigate("create-conference")}
            className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Tạo hội nghị
          </button>
        </div>

        {/* Conference List Section */}
        <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border-light flex justify-between items-center bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold">Danh sách Hội nghị của bạn</h3>
          </div>

          {deleteError && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
              <p className="font-bold">Lỗi: </p>
              <p>{deleteError}</p>
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : conferences.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Chưa có hội nghị nào. Hãy tạo hội nghị mới!
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-border-light text-xs uppercase text-text-sec-light">
                <tr>
                  <th className="p-3">Tên hội nghị</th>
                  <th className="p-3">Viết tắt</th>
                  <th className="p-3">Địa điểm</th>
                  <th className="p-3">Ngày bắt đầu</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {conferences.map((conf) => {
                  const isOwner = user?.id === conf.createdBy;
                  return (
                    <tr
                      key={conf.conferenceId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 font-medium">{conf.name}</td>
                      <td className="p-3 font-mono text-primary">
                        {conf.acronym}
                      </td>
                      <td className="p-3">{conf.location || "N/A"}</td>
                      <td className="p-3">
                        {conf.startDate
                          ? new Date(conf.startDate).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${conf.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {conf.status || "DRAFT"}
                        </span>
                      </td>
                      <td className="p-3 flex gap-3 text-sm">
                        {isOwner ? (
                          <>
                            <button
                              onClick={() => {
                                if (onManageConference) {
                                  onManageConference(conf.conferenceId);
                                } else {
                                  onNavigate("cfp-management");
                                }
                              }}
                              className="text-primary hover:underline font-medium"
                            >
                              CFP
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => {
                                if (onManagePC) {
                                  onManagePC(conf.conferenceId);
                                } else {
                                  console.warn("onManagePC not defined");
                                }
                              }}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              PC
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => {
                                if (onManageSubmissions) {
                                  onManageSubmissions(conf.conferenceId);
                                } else {
                                  console.warn(
                                    "onManageSubmissions not defined",
                                  );
                                  onNavigate("submission-management");
                                }
                              }}
                              className="text-purple-600 hover:underline font-medium"
                            >
                              Bài nộp
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() =>
                                handleDeleteConference(
                                  conf.conferenceId,
                                  conf.name,
                                )
                              }
                              disabled={deleting === conf.conferenceId}
                              className="text-red-600 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Xoá hội nghị"
                            >
                              {deleting === conf.conferenceId
                                ? "Đang xoá..."
                                : "Xoá"}
                            </button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Stats Cards (Mockup for now) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 opacity-50 pointer-events-none grayscale">
          {/* ... (Existing stats code dimmed to indicate it's not real data yet) ... */}
          <div className="col-span-4 text-center p-4 border rounded border-dashed bg-gray-50">
            <span className="text-sm text-gray-500">
              Thống kê chi tiết sẽ hiển thị khi chọn hội nghị (Tính năng đang
              phát triển)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
