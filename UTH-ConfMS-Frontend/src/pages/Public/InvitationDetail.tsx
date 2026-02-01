import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewerApi, ReviewerInvitationDto } from '../../services/reviewerApi';
import { useAuth } from '../../contexts/AuthContext';

const InvitationDetail: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [invitation, setInvitation] = useState<ReviewerInvitationDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [responding, setResponding] = useState(false);

    useEffect(() => {
        fetchInvitationDetail();
    }, [token]);

    const fetchInvitationDetail = async () => {
        if (!token) {
            setError('Token không hợp lệ');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await reviewerApi.getInvitationByToken(token);
            setInvitation(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải thông tin lời mời');
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (isAccepted: boolean) => {
        if (!user) {
            // Redirect to login with return URL
            navigate(`/auth/login?returnUrl=/invitation/${token}`);
            return;
        }

        if (!invitation) return;

        try {
            setResponding(true);
            await reviewerApi.respondInvitation({
                token: invitation.token,
                isAccepted
            });

            // Show success message
            alert(isAccepted 
                ? 'Bạn đã chấp nhận lời mời thành công! Chào mừng bạn đến với hội đồng phản biện.' 
                : 'Bạn đã từ chối lời mời.');

            // Redirect based on action
            if (isAccepted) {
                navigate('/reviewer/dashboard');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý lời mời');
        } finally {
            setResponding(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin lời mời...</p>
                </div>
            </div>
        );
    }

    if (error || !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Lời mời không hợp lệ</h2>
                    <p className="text-gray-600 mb-6">{error || 'Lời mời không tồn tại hoặc đã hết hạn.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    if (invitation.status !== 'Pending') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                    <div className={`w-16 h-16 ${invitation.status === 'Accepted' ? 'bg-green-100' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        {invitation.status === 'Accepted' ? (
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {invitation.status === 'Accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {invitation.status === 'Accepted' 
                            ? 'Bạn đã chấp nhận lời mời này trước đó.' 
                            : 'Bạn đã từ chối lời mời này.'}
                    </p>
                    <button
                        onClick={() => navigate(invitation.status === 'Accepted' ? '/reviewer/dashboard' : '/')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        {invitation.status === 'Accepted' ? 'Đến Dashboard' : 'Quay về trang chủ'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-center">Lời mời tham gia Hội đồng Phản biện</h1>
                        <p className="text-blue-100 text-center mt-2">UTH Conference Management System</p>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Chi tiết lời mời</h2>
                            
                            <div className="space-y-4">
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <label className="text-sm font-medium text-gray-500">Hội nghị</label>
                                    <p className="text-lg font-semibold text-gray-900">{invitation.conferenceName}</p>
                                </div>

                                <div className="border-l-4 border-green-500 pl-4">
                                    <label className="text-sm font-medium text-gray-500">Người được mời</label>
                                    <p className="text-lg font-semibold text-gray-900">{invitation.fullName}</p>
                                    <p className="text-sm text-gray-600">{invitation.email}</p>
                                </div>

                                <div className="border-l-4 border-purple-500 pl-4">
                                    <label className="text-sm font-medium text-gray-500">Ngày gửi lời mời</label>
                                    <p className="text-lg text-gray-900">{new Date(invitation.sentAt).toLocaleString('vi-VN')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                            <h3 className="text-lg font-semibold text-blue-900 mb-3">Về vai trò Reviewer</h3>
                            <ul className="space-y-2 text-gray-700">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Đánh giá các bài báo được giao</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Cung cấp phản hồi xây dựng cho tác giả</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Đảm bảo chất lượng khoa học của hội nghị</span>
                                </li>
                            </ul>
                        </div>

                        {!user && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-yellow-800">
                                    <strong>Lưu ý:</strong> Bạn cần đăng nhập để chấp nhận lời mời này.
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => handleRespond(true)}
                                disabled={responding}
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                {responding ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang xử lý...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Chấp nhận lời mời
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => handleRespond(false)}
                                disabled={responding}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <span className="flex items-center justify-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Từ chối
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với ban tổ chức hội nghị.</p>
                </div>
            </div>
        </div>
    );
};

export default InvitationDetail;
