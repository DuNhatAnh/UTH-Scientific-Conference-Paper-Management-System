
import React from 'react';
import { ViewState } from '../../App';
import { AIBadge } from '../../components/AIBadge';

interface DashboardProps {
    onNavigate: (view: ViewState) => void;
}

export const AuthorDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
        <div className="w-full max-w-[1200px]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">Trang Tác Giả</h1>
                    <p className="text-sm text-text-sec-light">Quản lý các bài báo đã nộp của bạn</p>
                </div>
                <button 
                    onClick={() => onNavigate('submit-paper')}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover shadow-sm font-medium transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span> Nộp bài mới
                </button>
            </div>

            {/* Submissions List */}
            <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-text-sec-light uppercase border-b border-border-light">
                                <th className="p-4 font-bold">ID</th>
                                <th className="p-4 font-bold">Tiêu đề bài báo</th>
                                <th className="p-4 font-bold">Chủ đề</th>
                                <th className="p-4 font-bold">Trạng thái</th>
                                <th className="p-4 font-bold">Cập nhật</th>
                                <th className="p-4 font-bold">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light text-sm">
                            <tr className="hover:bg-background-light dark:hover:bg-gray-800 transition-colors">
                                <td className="p-4 font-mono text-xs">#342</td>
                                <td className="p-4 font-medium max-w-xs truncate">Optimizing Neural Networks for Edge Devices</td>
                                <td className="p-4">AI & Big Data</td>
                                <td className="p-4">
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Under Review</span>
                                </td>
                                <td className="p-4 text-text-sec-light">12/05/2024</td>
                                <td className="p-4">
                                    <button className="text-primary font-medium hover:underline text-xs mr-3">Xem</button>
                                    <button className="text-text-sec-light font-medium hover:text-red-500 hover:underline text-xs">Rút bài</button>
                                </td>
                            </tr>
                            <tr className="hover:bg-background-light dark:hover:bg-gray-800 transition-colors">
                                <td className="p-4 font-mono text-xs">#156</td>
                                <td className="p-4 font-medium max-w-xs truncate">A Survey on Smart Grid Security Protocols</td>
                                <td className="p-4">Energy Systems</td>
                                <td className="p-4 flex flex-col gap-1">
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 w-fit">Accepted</span>
                                    <div className="mt-1">
                                        <AIBadge label="AI Checked" size="sm" />
                                    </div>
                                </td>
                                <td className="p-4 text-text-sec-light">10/04/2024</td>
                                <td className="p-4">
                                    <button onClick={() => onNavigate('decision')} className="text-primary font-medium hover:underline text-xs mr-3">Kết quả</button>
                                    <button className="text-primary font-medium hover:underline text-xs">Camera-ready</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-border-light bg-gray-50 dark:bg-gray-800 text-xs text-center text-text-sec-light">
                    Hiển thị 2 trong tổng số 2 bài báo
                </div>
            </div>

        </div>
    </div>
  );
};