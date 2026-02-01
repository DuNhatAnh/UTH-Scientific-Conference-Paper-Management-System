import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ViewState } from '../../App';
import { authApi } from '../../services/authApi';
import logo from '../../assets/logo.png';

interface RegisterProps {
  onNavigate: (view: ViewState) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  // 1. State lưu dữ liệu form
  const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Thêm state thông báo thành công

  // Hàm xử lý khi nhập liệu
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
          ...formData,
          [e.target.id]: e.target.value
      });
      setError(''); // Xóa lỗi khi nhập lại
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // 2. Validate phía Client
    if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp!');
        setIsLoading(false);
        return;
    }

    if (formData.password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự!');
        setIsLoading(false);
        return;
    }

    try {
        // 3. Gọi API thật xuống Backend
        const payload = {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password
        };

        const response = await authApi.register(payload);

        // 4. Kiểm tra phản hồi từ Server
        if (response.success) {
            setSuccess('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
            
            // Đợi 2 giây cho người dùng đọc thông báo rồi mới chuyển trang
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setError(response.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }

    } catch (err: any) {
        // 5. Xử lý lỗi từ Backend (ví dụ: Email trùng)
        console.error("Register Error:", err);
        const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại kết nối.';
        setError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center grow py-12 px-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md bg-white dark:bg-card-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
            {/* Chỉnh size-12 (48px) hoặc lớn hơn nếu muốn logo to hơn */}
    <div className="size-30 mx-auto mb-4"> 
        <img 
            src={logo} 
            alt="Logo" 
            className="w-full h-full object-contain" 
        />
    </div>
    <h2 className="text-2xl font-bold ...">Chào mừng trở lại</h2>
            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-1">Tạo tài khoản mới</h2>
            <p className="text-text-sec-light dark:text-text-sec-dark text-sm">Tham gia cộng đồng nghiên cứu khoa học</p>
        </div>

        {/* Form */}
        <div className="px-8 pb-8">
            <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                
                {/* Hiển thị lỗi màu đỏ */}
                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Hiển thị thành công màu xanh */}
                {success && (
                    <div className="p-3 text-sm text-green-600 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400">
                        {success}
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="fullName">Họ và tên</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec-light">
                            <span className="material-symbols-outlined text-[20px]">person</span>
                        </span>
                        <input 
                            id="fullName" 
                            type="text" 
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Nguyễn Văn A"
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="email">Email</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec-light">
                            <span className="material-symbols-outlined text-[20px]">mail</span>
                        </span>
                        <input 
                            id="email"
                            type="email" 
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="password">Mật khẩu</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec-light">
                            <span className="material-symbols-outlined text-[20px]">lock</span>
                        </span>
                        <input 
                            id="password"
                            type="password" 
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec-light">
                            <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                        </span>
                        <input 
                            id="confirmPassword" 
                            type="password" 
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-start gap-2 mt-2">
                    <input type="checkbox" id="terms" className="mt-1 rounded text-primary focus:ring-primary border-gray-300 dark:border-gray-600 dark:bg-gray-700" required />
                    <label htmlFor="terms" className="text-xs text-text-sec-light dark:text-text-sec-dark">
                        Tôi đồng ý với <a href="#" className="text-primary hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a>.
                    </label>
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className={`w-full h-11 rounded-lg bg-primary text-white font-bold text-sm shadow-md transition-all mt-2 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover hover:shadow-lg'}`}
                >
                    {isLoading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>Đang xử lý...</span>
                        </>
                    ) : (
                        "Đăng ký tài khoản"
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-text-sec-light dark:text-text-sec-dark">
                    Đã có tài khoản?{" "}
                    <Link to="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">Đăng nhập</Link>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};