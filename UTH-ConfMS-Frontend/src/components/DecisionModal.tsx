
import React, { useState } from 'react';
import { MakeDecisionRequest } from '../services/reviewApi';

interface DecisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MakeDecisionRequest) => Promise<void>;
    paperId: string | number;
    paperTitle: string;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({ isOpen, onClose, onSubmit, paperId, paperTitle }) => {
    const [status, setStatus] = useState<'Accepted' | 'Rejected' | 'Revision'>('Accepted');
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({
                paperId,
                status,
                comments
            });
            onClose();
        } catch (error) {
            console.error("Lỗi khi gửi quyết định:", error);
            alert("Có lỗi xảy ra khi gửi quyết định. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Quyết định cho bài báo</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    <div>
                        <div className="text-sm text-gray-500 mb-1 font-medium">Đang xử lý bài báo:</div>
                        <div className="font-bold text-gray-800 line-clamp-2">#{paperId} - {paperTitle}</div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-gray-700">Quyết định cuối cùng</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setStatus('Accepted')}
                                className={`py-3 px-2 rounded-lg border-2 font-bold text-sm transition ${status === 'Accepted' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined block mb-1">check_circle</span>
                                Chấp nhận
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus('Revision')}
                                className={`py-3 px-2 rounded-lg border-2 font-bold text-sm transition ${status === 'Revision' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined block mb-1">history_edu</span>
                                Cần sửa
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus('Rejected')}
                                className={`py-3 px-2 rounded-lg border-2 font-bold text-sm transition ${status === 'Rejected' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined block mb-1">cancel</span>
                                Từ chối
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-gray-700">Ghi chú/Nhận xét của Chair (Gửi tới Tác giả)</label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full h-32 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none resize-none text-sm transition"
                            placeholder="Nhập lý do hoặc yêu cầu chỉnh sửa..."
                        />
                    </div>

                    <div className="mt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold text-white shadow-lg transition 
                                ${status === 'Accepted' ? 'bg-green-600 hover:bg-green-700' :
                                    status === 'Rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
                                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Xác nhận quyết định'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
