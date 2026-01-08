import React, { useState } from 'react';
import { ViewState } from '../../App';
// import { useAuth } from '../../contexts/AuthContext'; // Không cần dùng useAuth ở đây nữa vì đăng ký xong phải login lại
import { authApi } from '../../services/api'; // Đảm bảo bạn đã thêm register vào api.ts như hướng dẫn trước

interface RegisterProps {
  onNavigate: (view: ViewState) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  // 1. State lưu dữ liệu form
  const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Hàm xử lý khi nhập liệu
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
          ...formData,
          [e.target.id]: e.target.value // id của input phải trùng với key trong state (fullName, email...)
      });
      setError(''); // Xóa lỗi khi nhập lại
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 2. Validate phía Client
    if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp!');
        setIsLoading(false);
        return;
    }

    try {
        // 3. Gọi API thật xuống Backend
        // Backend mong đợi: { fullName, email, password }
        const payload = {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password
        };

        await authApi.register(payload);

        // 4. Thành công -> Chuyển sang trang Login
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        onNavigate('login');

    } catch (err: any) {
        // 5. Xử lý lỗi từ Backend (ví dụ: Email trùng)
        const msg = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
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
            {/* Logo SVG giữ nguyên */}
            <div className="size-12 text-primary mx-auto mb-4">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4ZM14 32C14 30.9 14.9 30 16 30H32C33.1 30 34 30.9 34 32V34H14V32ZM24 26C21.79 26 20 24.21 20 22C20 19.79 21.79 18 24 18C26.21 18 28 19.79 28 22C28 24.21 26.21 26 24 26ZM34 16H14V14H34V16Z" fill="currentColor"></path>
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-1">Tạo tài khoản mới</h2>
            <p className="text-text-sec-light dark:text-text-sec-dark text-sm">Tham gia cộng đồng nghiên cứu khoa học</p>
        </div>

        {/* Form */}
        <div className="px-8 pb-8">
            <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                
                {/* Hiển thị lỗi nếu có */}
                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="fullName">Họ và tên</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec-light">
                            <span className="material-symbols-outlined text-[20px]">person</span>
                        </span>
                        <input 
                            id="fullName" // Quan trọng: Phải khớp tên field trong state formData
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
                            id="confirmPassword" // Quan trọng: Khớp state
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
                    <button onClick={() => onNavigate('login')} className="font-semibold text-primary hover:text-primary-hover transition-colors">Đăng nhập</button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};