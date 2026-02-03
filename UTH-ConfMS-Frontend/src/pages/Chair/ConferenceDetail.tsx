import React, { useState } from "react";
import { ViewState } from "../../App";
import { SubmissionList } from "./SubmissionList";
import { SubmissionManagement } from "./SubmissionManagement";
import { CFPManagement } from "./CFPManagement";
import { PCMemberManagement } from "./PCMemberManagement";
import { ConferenceSettings } from "./ConferenceSettings";
import { PaperAssignment } from "./PaperAssignment";

interface ConferenceDetailProps {
  conferenceId: string;
  conferenceName?: string;
  submissionDeadline?: string;
  onNavigate: (view: ViewState) => void;
  onBack: () => void;
}

export const ConferenceDetail: React.FC<ConferenceDetailProps> = ({
  conferenceId,
  conferenceName,
  submissionDeadline,
  onNavigate,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    "submissions" | "assignment" | "decision" | "cfp" | "pc" | "settings"
  >("cfp");

  const tabs = [
    { id: "cfp", label: "Gọi Bài Báo", icon: "announcement" },
    { id: "submissions", label: "Danh Sách Bài Nộp", icon: "description" },
    { id: "pc", label: "Hội Đồng Chương Trình", icon: "groups" },
    { id: "assignment", label: "Phân Công Bài Báo", icon: "assignment_ind" },
    { id: "decision", label: "Quyết Định Bài Báo", icon: "fact_check" },
    { id: "settings", label: "Cài Đặt Hội Nghị", icon: "settings" },
  ] as const;

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
      <div className="w-full max-w-[1400px] flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Quay lại"
          >
            <span className="material-symbols-outlined text-[24px]">
              arrow_back
            </span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main-dark">
              {conferenceName || "Chi Tiết Hội Nghị"}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-text-sec-light dark:text-text-sec-dark">
                Quản lý bài nộp, phân công, quyết định, CFP và hội đồng chương trình
              </p>
              {submissionDeadline && (
                <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  <span className="material-symbols-outlined text-[14px]">event</span>
                  Hạn nộp: {(() => {
                    const date = new Date(submissionDeadline);
                    if (isNaN(date.getTime()) || date.getFullYear() < 1900) return "Chưa xác định";
                    return date.toLocaleDateString("vi-VN");
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-primary"
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm p-6">
          {activeTab === "submissions" && (
            <SubmissionList conferenceId={conferenceId} />
          )}
          {activeTab === "assignment" && (
            <PaperAssignment
              conferenceId={conferenceId}
              submissionDeadline={submissionDeadline}
              onSwitchTab={setActiveTab}
            />
          )}
          {activeTab === "decision" && (
            <SubmissionManagement
              onNavigate={onNavigate}
              conferenceId={conferenceId}
            />
          )}
          {activeTab === "cfp" && (
            <CFPManagement
              onNavigate={onNavigate}
              conferenceId={conferenceId}
            />
          )}
          {activeTab === "pc" && (
            <PCMemberManagement
              conferenceId={conferenceId}
              onNavigate={onNavigate}
            />
          )}
          {activeTab === "settings" && (
            <ConferenceSettings
              conferenceId={conferenceId}
              onUpdateSuccess={() => {
                // Update header if needed or just keep current state
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
