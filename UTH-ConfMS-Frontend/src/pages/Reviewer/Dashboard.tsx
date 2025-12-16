
import React, { useState } from 'react';
import { PDFPreview } from '../../components/PDFPreview';
import { AIBadge } from '../../components/AIBadge';

export const ReviewerDashboard: React.FC = () => {
  const [selectedPaper, setSelectedPaper] = useState<number | null>(null);

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Paper List */}
            <div className={`lg:col-span-${selectedPaper ? '1' : '3'} flex flex-col gap-4 transition-all`}>
                <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-2">Bài được phân công</h1>
                {[1, 2, 3].map((id) => (
                    <div 
                        key={id} 
                        onClick={() => setSelectedPaper(id)}
                        className={`bg-white dark:bg-card-dark p-5 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedPaper === id ? 'border-primary ring-1 ring-primary' : 'border-border-light'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">#{100 + id}</span>
                            <span className="text-xs font-bold text-red-500">Hạn: 25/06</span>
                        </div>
                        <h3 className="font-bold text-sm mb-2">Deep Learning Approaches for Traffic Flow Prediction in Smart Cities</h3>
                        <p className="text-xs text-text-sec-light line-clamp-2">This paper proposes a novel hybrid architecture combining CNN and LSTM to predict traffic flow with high accuracy...</p>
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">AI & Big Data</span>
                            <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium">Chờ phản biện</span>
                            {id === 1 && <AIBadge label="High Match" size="sm" />}
                        </div>
                    </div>
                ))}
            </div>

            {/* Review Form (Visible when selected) */}
            {selectedPaper && (
                <div className="lg:col-span-2 bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-lg flex flex-col h-[800px] overflow-hidden">
                    <div className="p-4 border-b border-border-light flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                        <h3 className="font-bold">Đánh giá bài báo #{100 + selectedPaper}</h3>
                        <button onClick={() => setSelectedPaper(null)} className="text-gray-400 hover:text-gray-600 material-symbols-outlined">close</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex flex-col gap-6">
                            
                            {/* PDF Preview Integration */}
                            <div className="h-64 w-full">
                                <PDFPreview fileName={`paper_${100 + selectedPaper}_v1.pdf`} />
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold border-b pb-1">Tiêu chí đánh giá</h4>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                    <label className="text-sm">Tính mới & Đóng góp</label>
                                    <select className="text-sm border rounded p-1"><option>5 - Xuất sắc</option><option>4 - Tốt</option><option>3 - Khá</option></select>
                                    
                                    <label className="text-sm">Phương pháp nghiên cứu</label>
                                    <select className="text-sm border rounded p-1"><option>4 - Tốt</option></select>
                                    
                                    <label className="text-sm">Trình bày & Ngôn ngữ</label>
                                    <select className="text-sm border rounded p-1"><option>3 - Khá</option></select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold">Nhận xét chi tiết cho tác giả</h4>
                                <textarea className="w-full h-32 p-3 border rounded text-sm resize-none" placeholder="Điểm mạnh, điểm yếu, đề xuất chỉnh sửa..."></textarea>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold">Nhận xét bí mật cho Ban chương trình</h4>
                                <textarea className="w-full h-20 p-3 border rounded text-sm resize-none bg-yellow-50" placeholder="Chỉ ban chương trình mới thấy nội dung này..."></textarea>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="font-bold">Quyết định đề xuất</h4>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="decision" className="text-green-600"/> Accept</label>
                                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="decision" className="text-yellow-600"/> Minor Revision</label>
                                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="decision" className="text-red-600"/> Reject</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-border-light bg-gray-50 flex justify-end gap-3">
                        <button className="px-4 py-2 rounded text-sm font-medium hover:bg-gray-200">Lưu nháp</button>
                        <button className="px-4 py-2 rounded bg-primary text-white text-sm font-bold hover:bg-primary-hover shadow-sm">Gửi đánh giá</button>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};