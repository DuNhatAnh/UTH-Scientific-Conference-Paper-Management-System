import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { reviewerApi } from '../../services/reviewerApi';

export const AcceptInvitation: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token không hợp lệ hoặc bị thiếu.');
            return;
        }
        // Tự động xử lý hoặc chờ user bấm nút xác nhận (ở đây làm UI chờ bấm)
        setStatus('loading');
    }, [token]);

    const handleRespond = async (isAccepted: boolean) => {
        if (!token) return;
        try {
            await reviewerApi.respondInvitation({
                token: token,
                isAccepted: isAccepted
            });
            setStatus('success');
            setMessage(isAccepted ? "Bạn đã chấp nhận tham gia hội đồng PC." : "Bạn đã từ chối lời mời.");
            
            // Chuyển hướng sau 3s
            setTimeout(() => navigate('/login'), 3000);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || "Có lỗi xảy ra khi xử lý lời mời.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl">mail</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Lời mời tham gia PC Member</h2>
                        <p className="text-gray-600 mb-6">Bạn nhận được lời mời tham gia hội đồng đánh giá bài báo khoa học.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => handleRespond(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Từ chối</button>
                            <button onClick={() => handleRespond(true)} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover font-bold">Chấp nhận tham gia</button>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl">check_circle</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Thành công!</h2>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-400 mt-4">Đang chuyển hướng về trang đăng nhập...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl">error</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Lỗi</h2>
                        <p className="text-red-600">{message}</p>
                        <button onClick={() => navigate('/')} className="mt-4 text-primary hover:underline">Về trang chủ</button>
                    </div>
                )}
            </div>
        </div>
    );
};