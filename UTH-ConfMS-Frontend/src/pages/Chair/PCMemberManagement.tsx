import React, { useEffect, useState } from "react";
import { reviewerApi, ReviewerInvitationDto } from "../../services/reviewerApi";

interface PCMemberManagementProps {
  conferenceId?: string | number;
  onNavigate?: (view: any) => void;
}

export const PCMemberManagement: React.FC<PCMemberManagementProps> = ({
  conferenceId,
}) => {
  const [activeTab, setActiveTab] = useState<"members" | "invitations">(
    "members",
  );
  const [invitations, setInvitations] = useState<ReviewerInvitationDto[]>([]);
  const [reviewers, setReviewers] = useState<any[]>([]); // Thay any bằng Interface Reviewer nếu có
  const [loading, setLoading] = useState(false);

  // Form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [sending, setSending] = useState(false);

  // Sử dụng conferenceId từ props, fallback về GUID rỗng nếu không có
  const confId = conferenceId ? String(conferenceId) : "00000000-0000-0000-0000-000000000000";

  useEffect(() => {
    fetchData();
  }, [activeTab, confId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "invitations") {
        const res = await reviewerApi.getInvitations(confId);
        setInvitations(Array.isArray(res) ? res : (res as any).data || []);
      } else {
        const res = await reviewerApi.getReviewers(confId);
        setReviewers(Array.isArray(res) ? res : (res as any).data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await reviewerApi.inviteReviewer({
        conferenceId: confId,
        email: inviteEmail,
        fullName: inviteName,
      });
      alert("Đã gửi lời mời thành công!");
      setInviteEmail("");
      setInviteName("");
      if (activeTab === "invitations") fetchData(); // Reload list
    } catch (error: any) {
      alert(
        "Lỗi: " + (error.response?.data?.message || "Không thể gửi lời mời"),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">
        Quản lý Hội đồng Chương trình (PC)
      </h1>

      {/* Invite Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">mail</span> Gửi lời mời
          tham gia
        </h2>
        <form onSubmit={handleInvite} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Họ và tên</label>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
              placeholder="Ví dụ: Dr. Nguyen Van A"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none"
              placeholder="email@university.edu"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="bg-primary text-white px-6 py-2 rounded font-bold hover:bg-primary-hover disabled:opacity-50 h-[42px]"
          >
            {sending ? "Đang gửi..." : "Gửi lời mời"}
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium ${activeTab === "members" ? "text-primary border-b-2 border-primary" : "text-gray-500"}`}
          onClick={() => setActiveTab("members")}
        >
          Thành viên chính thức ({reviewers.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "invitations" ? "text-primary border-b-2 border-primary" : "text-gray-500"}`}
          onClick={() => setActiveTab("invitations")}
        >
          Lời mời đã gửi
        </button>
      </div>

      {/* List Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="p-4 border-b">Họ tên</th>
                <th className="p-4 border-b">Email</th>
                <th className="p-4 border-b">Trạng thái</th>
                {activeTab === "invitations" && (
                  <th className="p-4 border-b">Ngày gửi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {activeTab === "members"
                ? reviewers.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-4 border-b font-medium">{r.fullName}</td>
                    <td className="p-4 border-b">{r.email}</td>
                    <td className="p-4 border-b">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                        Đang hoạt động
                      </span>
                    </td>
                  </tr>
                ))
                : invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="p-4 border-b font-medium">
                      {inv.fullName}
                    </td>
                    <td className="p-4 border-b">{inv.email}</td>
                    <td className="p-4 border-b">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold 
                                                ${inv.status === "Accepted"
                            ? "bg-green-100 text-green-700"
                            : inv.status === "Declined"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {(() => {
                          switch (inv.status) {
                            case "Accepted": return "Đã chấp nhận";
                            case "Declined": return "Đã từ chối";
                            case "Pending": return "Đang chờ";
                            default: return inv.status;
                          }
                        })()}
                      </span>
                    </td>
                    <td className="p-4 border-b text-sm text-gray-500">
                      {new Date(inv.sentAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              {!loading &&
                ((activeTab === "members" && reviewers.length === 0) ||
                  (activeTab === "invitations" &&
                    invitations.length === 0)) && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
