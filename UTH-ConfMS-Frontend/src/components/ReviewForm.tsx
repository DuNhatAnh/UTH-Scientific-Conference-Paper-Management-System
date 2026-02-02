import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

// Định nghĩa kiểu dữ liệu cho Discussion
interface Discussion {
    paperId: string;
    content: string;
    userName: string;
    createdAt: string;
}

interface ReviewFormProps {
    paperId?: string; // Nhận ID bài báo từ cha
    onSuccess?: () => void; // Callback khi gửi thành công
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ paperId, onSuccess }) => {
    // State lưu dữ liệu form
    const [formData, setFormData] = useState({
        paperId: paperId || '',
        noveltyScore: 5,
        methodologyScore: 5,
        presentationScore: 5,
        commentsForAuthor: '',
        confidentialComments: '',
        recommendation: 'Accept'
    });

    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);
    const [isExistingReview, setIsExistingReview] = useState(false);

    // State cho phần Thảo luận (Discussion)
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (formData.paperId) {
            fetchDiscussions();
            fetchMyReview();
        }
    }, [formData.paperId]);

    // Cập nhật form khi paperId từ props thay đổi
    useEffect(() => {
        if (paperId) {
            setFormData(prev => ({ ...prev, paperId: paperId }));
        }
    }, [paperId]);

    const fetchDiscussions = async () => {
        try {
            const response = await apiClient.get(`/api/reviews/discussion/${formData.paperId}`);
            if (response.data && response.data.data) {
                setDiscussions(response.data.data);
            } else if (Array.isArray(response.data)) {
                setDiscussions(response.data);
            }
        } catch (error) {
            console.error("Lỗi tải thảo luận:", error);
        }
    };

    const fetchMyReview = async () => {
        try {
            const response = await apiClient.get(`/api/reviews/my-review/${formData.paperId}`);
            if (response.data && response.data.success && response.data.data) {
                const d = response.data.data;
                setFormData(prev => ({
                    ...prev,
                    noveltyScore: d.noveltyScore ?? 5,
                    methodologyScore: d.methodologyScore ?? 5,
                    presentationScore: d.presentationScore ?? 5,
                    commentsForAuthor: d.commentsForAuthor || '',
                    confidentialComments: d.confidentialComments || '',
                    recommendation: d.recommendation || 'Accept'
                }));
                setIsExistingReview(true);
            }
        } catch (error) {
            console.error("Lỗi tải bài đánh giá cũ:", error);
        }
    };

    // Xử lý khi nhập liệu
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Xử lý khi bấm nút Gửi
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Gọi API Backend đang chạy ở port 5005
            const payload = {
                ...formData,
                // Giữ paperId là string hoặc number tùy ý, backend đã hỗ trợ string
                paperId: formData.paperId.toString(),
                noveltyScore: Number(formData.noveltyScore),
                methodologyScore: Number(formData.methodologyScore),
                presentationScore: Number(formData.presentationScore),
            };

            const response = await apiClient.post('/api/reviews/submit', payload);

            if (response.status === 200 || response.status === 201) {
                const successText = isExistingReview
                    ? '✅ Cập nhật đánh giá bài báo thành công!'
                    : '✅ Đánh giá bài báo thành công!';
                setMessage({ text: successText, type: 'success' });
                console.log('Response:', response.data);
                setIsExistingReview(true);
                if (onSuccess) onSuccess();
            }
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
            setMessage({ text: `❌ Lỗi: ${errorMsg}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Xử lý gửi thảo luận mới
    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;
        try {
            await apiClient.post('/api/reviews/discussion', {
                paperId: formData.paperId.toString(),
                content: newComment
            });
            setNewComment(''); // Xóa ô nhập
            fetchDiscussions(); // Tải lại danh sách
        } catch (error) {
            console.error("Lỗi gửi thảo luận:", error);
            alert("Không thể gửi thảo luận lúc này.");
        }
    };

    if (!formData.paperId) {
        return <div className="text-center text-red-500 p-10">Lỗi: Không tìm thấy ID bài báo để đánh giá.</div>;
    }

    return (
        <div className="w-full bg-background-light dark:bg-background-dark py-4 px-2 md:px-5 flex justify-center">
            <div className="w-full flex flex-col gap-8">
                <h1 className="text-2xl font-bold text-center text-primary">
                    {isExistingReview ? 'Cập Nhật Đánh Giá Bài Báo' : 'Đánh Giá Bài Báo (Review)'}
                </h1>

                <div className="bg-white dark:bg-card-dark p-8 rounded-xl border border-border-light shadow-sm">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                        {/* Paper ID */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Paper ID</label>
                            <input
                                type="text"
                                name="paperId"
                                value={formData.paperId}
                                onChange={handleChange}
                                disabled // Không cho sửa ID bằng tay
                                className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none bg-gray-100"
                            />
                        </div>

                        {/* Scores */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Tính mới (Novelty)', name: 'noveltyScore' },
                                { label: 'Phương pháp (Methodology)', name: 'methodologyScore' },
                                { label: 'Trình bày (Presentation)', name: 'presentationScore' }
                            ].map((field) => (
                                <div key={field.name} className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold">{field.label}</label>
                                    <select
                                        name={field.name}
                                        // @ts-ignore
                                        value={formData[field.name as keyof typeof formData]}
                                        onChange={handleChange}
                                        className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none bg-white"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* Comments */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Nhận xét cho tác giả <span className="text-red-500">*</span></label>
                            <textarea
                                name="commentsForAuthor"
                                value={formData.commentsForAuthor}
                                onChange={handleChange}
                                className="w-full h-32 p-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none resize-none"
                                placeholder="Nhập nhận xét chi tiết..."
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Nhận xét riêng (Chỉ BTC thấy)</label>
                            <textarea
                                name="confidentialComments"
                                value={formData.confidentialComments}
                                onChange={handleChange}
                                className="w-full h-20 p-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none resize-none"
                                placeholder="Nhận xét bí mật..."
                            />
                        </div>

                        {/* Recommendation */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold">Quyết định đề xuất</label>
                            <select name="recommendation" value={formData.recommendation} onChange={handleChange} className="w-full h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none bg-white">
                                <option value="Accept">Accept (Chấp nhận)</option>
                                <option value="Revision">Revision (Cần chỉnh sửa)</option>
                                <option value="Reject">Reject (Từ chối)</option>
                            </select>
                        </div>

                        {/* Message Alert */}
                        {message && (
                            <div className={`p-3 rounded text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end mt-4 pt-4 border-t border-border-light">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-6 py-2 rounded bg-primary text-white font-bold text-sm shadow-md flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover'}`}
                            >
                                {loading ? 'Đang gửi...' : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">
                                            {isExistingReview ? 'update' : 'send'}
                                        </span>
                                        {isExistingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Phần Thảo luận (Discussion Section) */}
                <div className="bg-white dark:bg-card-dark p-8 rounded-xl border border-border-light shadow-sm flex flex-col gap-5">
                    <h2 className="text-xl font-bold text-primary border-b pb-2">Thảo luận nội bộ (Discussion)</h2>

                    {/* Danh sách bình luận */}
                    <div className="flex flex-col gap-4 max-h-80 overflow-y-auto pr-2">
                        {discussions.length === 0 ? (
                            <p className="text-gray-500 italic text-center py-4">Chưa có thảo luận nào cho bài báo này.</p>
                        ) : (
                            discussions.map((d, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm text-blue-600 dark:text-blue-400">{d.userName || 'Reviewer'}</span>
                                        <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{d.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Ô nhập bình luận mới */}
                    <div className="flex gap-2 mt-2 pt-4 border-t border-gray-100">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Nhập nội dung thảo luận..."
                            className="flex-1 h-10 px-3 rounded border border-border-light focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-900"
                            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                        />
                        <button
                            onClick={handleCommentSubmit}
                            className="px-4 py-2 rounded bg-gray-600 text-white font-bold text-sm hover:bg-gray-700 transition-colors"
                        >
                            Gửi
                        </button>
                    </div>
                </div>
            </div >
        </div >
    );
};