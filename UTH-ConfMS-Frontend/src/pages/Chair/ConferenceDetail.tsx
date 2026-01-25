import React, { useState } from "react";
import { ViewState } from "../../App";
import { SubmissionList } from "./SubmissionList";
import { SubmissionManagement } from "./SubmissionManagement";
import { CFPManagement } from "./CFPManagement";
import { PCMemberManagement } from "./PCMemberManagement";

interface ConferenceDetailProps {
  conferenceId: string;
  conferenceName?: string;
  onNavigate: (view: ViewState) => void;
  onBack: () => void;
}

export const ConferenceDetail: React.FC<ConferenceDetailProps> = ({
  conferenceId,
  conferenceName,
  onNavigate,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    "submissions" | "decision" | "cfp" | "pc"
  >("submissions");

  const tabs = [
    { id: "submissions", label: "Danh Sách Bài Nộp", icon: "description" },
    { id: "decision", label: "Quyết Định Bài Báo", icon: "fact_check" },
    { id: "cfp", label: "Gọi Bài Báo", icon: "announcement" },
    { id: "pc", label: "Hội Đồng Chương Trình", icon: "groups" },
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
            <p className="text-sm text-text-sec-light dark:text-text-sec-dark mt-1">
              Quản lý bài nộp, quyết định, CFP và hội đồng chương trình
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id
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
        </div>
      </div>
    </div>
  );
};
