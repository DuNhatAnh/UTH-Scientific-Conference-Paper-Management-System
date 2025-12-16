
import React from 'react';

export const ChairDashboard: React.FC = () => {
  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
        <div className="w-full max-w-[1200px] flex flex-col gap-8">
            <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">Dashboard Trưởng Ban Chương Trình</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm">
                    <p className="text-xs text-text-sec-light uppercase font-bold mb-1">Tổng bài nộp</p>
                    <p className="text-3xl font-black text-primary">142</p>
                </div>
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm">
                    <p className="text-xs text-text-sec-light uppercase font-bold mb-1">Đang phản biện</p>
                    <p className="text-3xl font-black text-yellow-500">89</p>
                </div>
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm">
                    <p className="text-xs text-text-sec-light uppercase font-bold mb-1">Hoàn thành review</p>
                    <p className="text-3xl font-black text-green-500">45%</p>
                </div>
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light shadow-sm">
                    <p className="text-xs text-text-sec-light uppercase font-bold mb-1">Chấp nhận</p>
                    <p className="text-3xl font-black text-blue-500">12</p>
                </div>
            </div>

            {/* Management Table */}
            <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-bold">Quản lý bài báo & Phân công</h3>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Tìm kiếm..." className="px-3 py-1.5 rounded border text-sm" />
                        <button className="text-xs font-bold bg-white border rounded px-3">Filter</button>
                    </div>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-border-light text-xs uppercase text-text-sec-light">
                        <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Tiêu đề</th>
                            <th className="p-3">Tác giả</th>
                            <th className="p-3">Reviewer 1</th>
                            <th className="p-3">Reviewer 2</th>
                            <th className="p-3">Quyết định</th>
                            <th className="p-3">Tác vụ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                        <tr>
                            <td className="p-3 font-mono">#156</td>
                            <td className="p-3 font-medium max-w-xs truncate">A Survey on Smart Grid Security...</td>
                            <td className="p-3">Nguyen Van A</td>
                            <td className="p-3"><span className="text-green-600 font-bold">Done (4/5)</span></td>
                            <td className="p-3"><span className="text-green-600 font-bold">Done (5/5)</span></td>
                            <td className="p-3"><span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Accept</span></td>
                            <td className="p-3"><button className="text-primary hover:underline">Chi tiết</button></td>
                        </tr>
                        <tr>
                            <td className="p-3 font-mono">#342</td>
                            <td className="p-3 font-medium max-w-xs truncate">Optimizing Neural Networks...</td>
                            <td className="p-3">Le Thi B</td>
                            <td className="p-3"><span className="text-yellow-600 font-bold">Pending</span></td>
                            <td className="p-3"><span className="text-gray-400 italic">Unassigned</span></td>
                            <td className="p-3"><span className="text-gray-400 text-xs">Waiting</span></td>
                            <td className="p-3"><button className="text-blue-600 hover:underline font-bold">+ Assign</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    </div>
  );
};