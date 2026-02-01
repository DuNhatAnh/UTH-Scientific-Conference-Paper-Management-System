import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ViewState } from '../../App';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/authApi';
import { jwtDecode } from 'jwt-decode';
import logo from '../../assets/logo.png';

interface LoginProps {
  onNavigate: (view: ViewState) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
        ...formData,
        [e.target.id]: e.target.value
    });
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');

      try {
          // 1. Gọi API Backend
          const response = await authApi.login(formData);
          
          // Dữ liệu thực tế trả về từ axios interceptor hoặc authApi
          // authApi trả về response.data (tức là ApiResponse<LoginResponse>)
          const resBody = response; 

          if (!resBody.success || !resBody.data) {
             throw new Error(resBody.message || 'Đăng nhập không thành công');
          }

          // 2. Lấy token
          const token = resBody.data.accessToken; 

          if (!token) {
             throw new Error('Không tìm thấy token hợp lệ từ server');
          }

          // 3. Cập nhật Context (Lưu token vào state chung)
          login(token);

          // 4. Giải mã Token để điều hướng (Routing)
          const decoded: any = jwtDecode(token);
          
          // Lấy role từ token (.NET identity claims)
          const rawRole = decoded.role || 
                          decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
                          '';
          
          const upperRole = rawRole.toString().toUpperCase();

          // Logic điều hướng dựa trên Role trong Token
          if (upperRole.includes('ADMIN')) {
              onNavigate('admin-dashboard');
          } else if (upperRole.includes('CHAIR')) {
              onNavigate('chair-dashboard');
          } else if (upperRole === 'REVIEWER') {
              onNavigate('reviewer-dashboard');
          } else {
              onNavigate('author-dashboard'); 
          }
          
      } catch (err: any) {
          console.error("Login Error:", err);
          const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
          setError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex flex-col items-center justify-center grow py-12 px-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md bg-white dark:bg-card-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden">
        
        <div className="px-8 pt-8 pb-6 text-center">
            {/* Chỉnh size-12 (48px) hoặc lớn hơn nếu muốn logo to hơn */}
    <div className="size-30 mx-auto mb-4"> 
        <img 
            src={logo} 
            alt="Logo" 
            className="w-full h-full object-contain" 
        />
    </div>
            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-1">Chào mừng trở lại</h2>
            <p className="text-text-sec-light dark:text-text-sec-dark text-sm">Đăng nhập vào hệ thống quản lý hội nghị</p>
        </div>

        <div className="px-8 pb-8">
            <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                
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
                    <Link to="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">Đăng ký ngay</Link>
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