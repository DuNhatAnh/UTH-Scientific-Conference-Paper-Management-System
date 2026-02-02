import React, { useState, useEffect } from "react";
import { ViewState } from "../../App";
import { AIBadge } from "../../components/AIBadge";
import { AISpellCheck } from "../../components/AISpellCheck";
import { useAuth } from "../../contexts/AuthContext";
import { paperApi, AuthorSubmission } from "../../services/paper";
import conferenceApi, { ConferenceDto, TrackDto } from "../../services/conferenceApi";
import { useSearchParams } from "react-router-dom";

interface SubmitProps {
  onNavigate: (view: ViewState) => void;
  editMode?: boolean; // Chế độ edit hay create
  submissionId?: string; // ID của submission cần edit
}

export const SubmitPaper: React.FC<SubmitProps> = ({ onNavigate, editMode = false, submissionId }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);

  // Form Data
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [topicId, setTopicId] = useState<string | undefined>(undefined);
  const [conferenceId, setConferenceId] = useState<string>(""); // Dùng string cho GUID
  const [authors, setAuthors] = useState<AuthorSubmission[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);

  // Danh sách hội nghị và tracks
  const [conferences, setConferences] = useState<ConferenceDto[]>([]);
  const [tracks, setTracks] = useState<TrackDto[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  // Load submission data khi ở edit mode
  useEffect(() => {
    const loadSubmissionData = async () => {
      if (editMode && submissionId) {
        setIsLoadingSubmission(true);
        try {
          const response = await paperApi.getPaperDetail(submissionId);
          const data = response.data;

          setTitle(data.title || "");
          setAbstract(data.abstract || "");
          setConferenceId(data.conferenceId || "");
          setTopicId(data.trackId || undefined);

          // Load authors
          if (data.authors && data.authors.length > 0) {
            const loadedAuthors = data.authors.map((a: any) => ({
              fullName: a.fullName,
              email: a.email,
              affiliation: a.affiliation || "",
              isCorresponding: a.isCorresponding,
              order: a.authorOrder,
            }));
            setAuthors(loadedAuthors);
          }
        } catch (error) {
          console.error("Failed to load submission:", error);
          alert("Không thể tải thông tin bài báo. Vui lòng thử lại.");
          onNavigate("author-dashboard");
        } finally {
          setIsLoadingSubmission(false);
        }
      }
    };

    loadSubmissionData();
  }, [editMode, submissionId]);

  // Initialize first author (chỉ khi create mode)
  useEffect(() => {
    if (!editMode && user && authors.length === 0) {
      setAuthors([
        {
          fullName: user.name || "",
          email: user.email || "",
          affiliation: "",
          isCorresponding: true,
          order: 1,
        },
      ]);
    }
  }, [editMode, user]);

  // Load danh sách hội nghị từ API
  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await conferenceApi.getConferences();
        if (response.success && response.data) {
          // @ts-ignore - Handle backend inconsistency (Items vs Data)
          const list = (response.data.items || response.data.data || []) as ConferenceDto[];
          // Chỉ lấy các hội nghị đang mở nộp bài (CFP_OPEN)
          const openConferences = list.filter(c => c.status === "CFP_OPEN");
          setConferences(openConferences);
          
          // Auto-select conference from URL params if available
          const conferenceIdFromUrl = searchParams.get('conferenceId');
          if (conferenceIdFromUrl && !editMode) {
            setConferenceId(conferenceIdFromUrl);
          }
        }
      } catch (error) {
        console.error("Failed to fetch conferences:", error);
      }
    };
    fetchConferences();
  }, [searchParams, editMode]);

  // Load tracks khi chọn conference
  useEffect(() => {
    const fetchTracks = async () => {
      if (!conferenceId) {
        setTracks([]);
        return;
      }

      setIsLoadingTracks(true);
      try {
        const response = await conferenceApi.getTracks(conferenceId);
        if (response.success && response.data) {
          setTracks(response.data);
        } else {
          setTracks([]);
        }
      } catch (error) {
        console.error("Failed to fetch tracks:", error);
        setTracks([]);
      } finally {
        setIsLoadingTracks(false);
      }
    };

    fetchTracks();
  }, [conferenceId]);

  const handleAddAuthor = () => {
    setAuthors([
      ...authors,
      {
        fullName: "",
        email: "",
        affiliation: "",
        isCorresponding: false,
        order: authors.length + 1,
      },
    ]);
  };

  const handleAuthorChange = (
    index: number,
    field: keyof AuthorSubmission,
    value: any,
  ) => {
    const newAuthors = [...authors];
    newAuthors[index] = { ...newAuthors[index], [field]: value };
    setAuthors(newAuthors);
  };

  const handleRemoveAuthor = (index: number) => {
    if (index === 0) return; // Cannot remove self
    const newAuthors = authors
      .filter((_, i) => i !== index)
      .map((auth, i) => ({ ...auth, order: i + 1 }));
    setAuthors(newAuthors);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validation
      if (selectedFile.type !== "application/pdf") {
        alert("Vui lòng chọn file định dạng PDF.");
        e.target.value = "";
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File quá lớn. Vui lòng chọn file dưới 10MB.");
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];

      // Validation
      if (selectedFile.type !== "application/pdf") {
        alert("Vui lòng chọn file định dạng PDF.");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File quá lớn. Vui lòng chọn file dưới 10MB.");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async () => {
    // Validation khác nhau giữa create và edit mode
    if (!editMode) {
      if (!agree) {
        alert("Vui lòng cam kết bài báo chưa từng được xuất bản.");
        return;
      }
      if (!file) {
        alert("Vui lòng tải lên file PDF.");
        return;
      }
    }

    if (!conferenceId) {
      alert("Vui lòng chọn hội nghị.");
      return;
    }

    setIsSubmitting(true);
    try {
      const keywordList = keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);

      if (editMode && submissionId) {
        // Edit mode - gọi updatePaper
        await paperApi.updatePaper(submissionId, {
          title,
          abstract,
          keywords: keywordList,
          authors: authors,
          file: file || undefined,
        });
        alert("Cập nhật bài báo thành công!");
      } else {
        // Create mode - gọi submitPaper
        await paperApi.submitPaper({
          title,
          abstract,
          keywords: keywordList,
          conferenceId: conferenceId,
          topicId: topicId,
          authors: authors,
          file: file!,
        });
        alert("Nộp bài thành công!");
      }

      onNavigate("author-dashboard");
    } catch (error: any) {
      console.error("Error submitting/updating paper:", error);
      const msg =
        error.response?.data?.message ||
        (editMode ? "Có lỗi xảy ra khi cập nhật bài. Vui lòng thử lại." : "Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.");
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-12 px-5 md:px-10 flex justify-center">
      <div className="w-full max-w-[800px] flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-center text-primary">
          {editMode ? "Chỉnh Sửa Bài Báo" : "Nộp Bài Báo Mới"}
        </h1>

        {/* Stepper */}
        <div className="flex items-center justify-between w-full px-10">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}
            >
              1
            </div>
            <span className="text-xs font-medium">Thông tin</span>
          </div>
          <div
            className={`flex-1 h-0.5 mx-2 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}
          ></div>
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}
            >
              2
            </div>
            <span className="text-xs font-medium">Tác giả</span>
          </div>
          <div
            className={`flex-1 h-0.5 mx-2 ${step >= 3 ? "bg-primary" : "bg-gray-200"}`}
          ></div>
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}
            >
              3
            </div>
            <span className="text-xs font-medium">Tập tin</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-card-dark p-8 rounded-xl border border-border-light shadow-sm">
          {isLoadingSubmission ? (
            <div className="p-8 text-center text-text-sec-light">
              Đang tải dữ liệu...
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  {/* Chọn Hội Nghị - Load từ API */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold">
                      Hội nghị <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={conferenceId}
                      onChange={(e) => setConferenceId(e.target.value)}
                      disabled={editMode}
                      className={`w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none ${editMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                    >
                      <option value="">Chọn hội nghị...</option>
                      {conferences.map((conf) => (
                        <option key={conf.conferenceId} value={conf.conferenceId}>
                          {conf.name} ({conf.acronym}) - Hạn:{" "}
                          {(() => {
                            const date = new Date(conf.submissionDeadline);
                            if (isNaN(date.getTime()) || date.getFullYear() < 1900) return "Chưa có";
                            return date.toLocaleDateString("vi-VN");
                          })()}
                        </option>
                      ))}
                    </select>
                    {conferences.length === 0 && (
                      <p className="text-xs text-red-500">
                        Không tìm thấy hội nghị nào đang mở. Vui lòng liên hệ quản
                        trị viên.
                      </p>
                    )}
                    {conferenceId && conferences.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                          event
                        </span>
                        <div className="text-sm text-blue-900">
                          <p className="font-semibold">
                            Ngày nộp bài:{" "}
                            <span className="text-primary">
                              {(() => {
                                const deadline = conferences.find(
                                  (c) => c.conferenceId === conferenceId,
                                )?.submissionDeadline;
                                if (!deadline) return "N/A";
                                try {
                                  const date = new Date(deadline);
                                  // Handle 0001-01-01 or other invalid dates from backend
                                  if (isNaN(date.getTime()) || date.getFullYear() < 1900) {
                                    return "Chưa xác định";
                                  }
                                  return date.toLocaleDateString("vi-VN", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  });
                                } catch {
                                  return "N/A";
                                }
                              })()}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold">
                      Tiêu đề bài báo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Nhập tiêu đề đầy đủ..."
                    />
                    {title && (
                      <AISpellCheck
                        text={title}
                        userId={user?.id || 'guest'}
                        fieldType="title"
                        onApply={(correctedText) => setTitle(correctedText)}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold">
                      Tóm tắt (Abstract) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      className="w-full h-32 p-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none resize-none"
                      placeholder="Tối đa 300 từ..."
                    ></textarea>
                    {abstract && (
                      <AISpellCheck
                        text={abstract}
                        userId={user?.id || 'guest'}
                        fieldType="abstract"
                        onApply={(correctedText) => setAbstract(correctedText)}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold">Từ khóa (Keywords)</label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Ví dụ: AI, IoT, Smart City (ngăn cách bởi dấu phẩy)"
                    />
                    {keywords && (
                      <AISpellCheck
                        text={keywords}
                        userId={user?.id || 'guest'}
                        fieldType="keywords"
                        onApply={(correctedText) => setKeywords(correctedText)}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold">
                      Chủ đề (Track) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={topicId || ""}
                      onChange={(e) => setTopicId(e.target.value)}
                      disabled={!conferenceId || isLoadingTracks}
                      className={`w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none ${!conferenceId || isLoadingTracks ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    >
                      <option value="">
                        {!conferenceId ? 'Vui lòng chọn hội nghị trước' : isLoadingTracks ? 'Đang tải tracks...' : 'Chọn chủ đề phù hợp...'}
                      </option>
                      {tracks.map((track) => (
                        <option key={track.trackId} value={track.trackId}>
                          {track.name}
                        </option>
                      ))}
                    </select>
                    {conferenceId && tracks.length === 0 && !isLoadingTracks && (
                      <p className="text-xs text-orange-600">
                        Hội nghị này chưa có track nào. Vui lòng liên hệ Chair để thêm track.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-2">
                    <span className="material-symbols-outlined text-primary">
                      info
                    </span>
                    <p className="text-sm text-blue-800">
                      Tác giả đầu tiên sẽ được mặc định là tác giả liên hệ
                      (Corresponding Author).
                    </p>
                  </div>

                  {authors.map((author, index) => (
                    <div
                      key={index}
                      className="border border-border-light rounded-lg p-4 relative"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-sm">
                          Tác giả {index + 1} {index === 0 ? "(Bạn)" : ""}
                        </h3>
                        {index > 0 && (
                          <button
                            onClick={() => handleRemoveAuthor(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <span className="material-symbols-outlined text-sm">
                              delete
                            </span>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={author.fullName}
                          onChange={(e) =>
                            handleAuthorChange(index, "fullName", e.target.value)
                          }
                          disabled={index === 0}
                          placeholder="Họ và tên"
                          className={`px-3 py-2 rounded text-sm border border-border-light ${index === 0 ? "bg-gray-100" : ""}`}
                        />
                        <input
                          type="text"
                          value={author.email}
                          onChange={(e) =>
                            handleAuthorChange(index, "email", e.target.value)
                          }
                          disabled={index === 0}
                          placeholder="Email"
                          className={`px-3 py-2 rounded text-sm border border-border-light ${index === 0 ? "bg-gray-100" : ""}`}
                        />
                        <input
                          type="text"
                          value={author.affiliation || ""}
                          onChange={(e) =>
                            handleAuthorChange(index, "affiliation", e.target.value)
                          }
                          placeholder="Đơn vị công tác (Affiliation)"
                          className="col-span-2 px-3 py-2 rounded text-sm border border-border-light"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddAuthor}
                    className="flex items-center justify-center gap-2 border border-dashed border-primary text-primary py-3 rounded-lg hover:bg-blue-50 font-medium text-sm"
                  >
                    <span className="material-symbols-outlined">add</span> Thêm tác
                    giả
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-purple-600">
                        psychology
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-purple-800 dark:text-purple-300">
                          AI Plagiarism Check
                        </h4>
                        <p className="text-xs text-purple-700 dark:text-purple-400">
                          Hệ thống sẽ tự động quét trùng lặp sau khi tải lên.
                        </p>
                      </div>
                    </div>
                    <AIBadge label="Powered" size="sm" />
                  </div>

                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors relative"
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="material-symbols-outlined text-[48px] text-gray-400 mb-2">
                      cloud_upload
                    </span>
                    <p className="font-medium">
                      {file ? (
                        file.name
                      ) : (
                        <span>
                          Kéo thả file PDF vào đây hoặc{" "}
                          <span className="text-primary underline">chọn file</span>
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-sec-light mt-2">
                      Định dạng PDF, tối đa 10MB.
                    </p>
                  </div>
                  {!editMode && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="confirm"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="confirm"
                        className="text-sm text-text-sec-light"
                      >
                        Tôi cam kết bài báo này chưa từng được xuất bản ở bất kỳ đâu.
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border-light">
                {step > 1 ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-2 rounded border border-border-light hover:bg-gray-100 font-medium text-sm"
                  >
                    Quay lại
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate("author-dashboard")}
                    className="px-6 py-2 rounded text-text-sec-light hover:text-red-500 font-medium text-sm"
                  >
                    Hủy bỏ
                  </button>
                )}

                {step < 3 ? (
                  <button
                    onClick={() => {
                      if (step === 1) {
                        if (!title || !abstract || !topicId || !conferenceId) {
                          alert(
                            "Vui lòng điền đầy đủ thông tin bắt buộc (bao gồm Hội nghị).",
                          );
                          return;
                        }
                      }
                      setStep(step + 1);
                    }}
                    className="px-6 py-2 rounded bg-primary text-white hover:bg-primary-hover font-medium text-sm shadow-sm"
                  >
                    Tiếp tục
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-bold text-sm shadow-md flex items-center gap-2 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSubmitting ? (
                      editMode ? "Đang cập nhật..." : "Đang nộp..."
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">
                          check
                        </span>{" "}
                        {editMode ? "Cập nhật bài báo" : "Hoàn tất nộp bài"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
