import React, { useState } from 'react';
import { ViewState } from '../../App';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api'; // Import api service

interface LoginProps {
  onNavigate: (view: ViewState) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  
  // State để lưu dữ liệu nhập và lỗi
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
        ...formData,
        [e.target.id]: e.target.value
    });
    setError(''); // Xóa lỗi khi người dùng nhập lại
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');

      try {
          // 1. Gọi API Backend
          const response = await authApi.login(formData);
          
          // 2. Lấy token từ response (Cấu trúc: { message, token })
          const { token } = response.data;

          // 3. Cập nhật Context
          login(token);

          // 4. Chuyển hướng (Context sẽ tự điều hướng hoặc ta gọi onNavigate tùy logic App)
          // Ở đây tạm thời ta chuyển về trang dashboard của role tương ứng (logic này nên nằm ở App.tsx hoặc AuthContext nhưng ta xử lý tạm ở đây)
          // Lưu ý: Sau khi login, user trong context sẽ được cập nhật, App sẽ re-render.
          // Nếu onNavigate chỉ đổi view, ta có thể để mặc định là author-dashboard hoặc check role từ token decode (phức tạp hơn xíu tại đây)
          onNavigate('author-dashboard'); 
          
      } catch (err: any) {
          // Xử lý lỗi từ BE trả về (thường là err.response.data.message)
          const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
          setError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex flex-col items-center justify-center grow py-12 px-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md bg-white dark:bg-card-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden">
        
        <div className="px-8 pt-8 pb-6 text-center">
            {/* ... (Giữ nguyên phần Logo SVG) ... */}
            <div className="size-12 text-primary mx-auto mb-4">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4ZM14 32C14 30.9 14.9 30 16 30H32C33.1 30 34 30.9 34 32V34H14V32ZM24 26C21.79 26 20 24.21 20 22C20 19.79 21.79 18 24 18C26.21 18 28 19.79 28 22C28 24.21 26.21 26 24 26ZM34 16H14V14H34V16Z" fill="currentColor"></path>
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-1">Chào mừng trở lại</h2>
            <p className="text-text-sec-light dark:text-text-sec-dark text-sm">Đăng nhập vào hệ thống quản lý hội nghị</p>
        </div>

        <div className="px-8 pb-8">
            <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                
                {/* Hiển thị lỗi nếu có */}
                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                        {error}
                    </div>
                )}

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
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="password">Mật khẩu</label>
                        <button 
                            type="button"
                            onClick={() => onNavigate('forgot-password')}
                            className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                            Quên mật khẩu?
                        </button>
                    </div>
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

                <button 
                    type="submit"
                    disabled={isLoading}
                    className={`w-full h-11 rounded-lg bg-primary text-white font-bold text-sm shadow-md transition-all mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover hover:shadow-lg'}`}
                >
                    {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-text-sec-light dark:text-text-sec-dark">
                    Chưa có tài khoản?{" "}
                    <button onClick={() => onNavigate('register')} className="font-semibold text-primary hover:text-primary-hover transition-colors">Đăng ký ngay</button>
                </p>
            </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 dark:bg-background-dark/50 border-t border-border-light dark:border-border-dark text-center">
             <p className="text-xs text-text-sec-light dark:text-text-sec-dark">Được bảo vệ bởi reCAPTCHA và tuân theo Chính sách bảo mật.</p>
        </div>
      </div>
    </div>
  );
};