
import React from 'react';
import { ViewState } from '../../App';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onNavigate: (view: ViewState) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulating a successful login
      login('author'); // Default to author for demo
      onNavigate('author-dashboard');
  };

  const handleDemoLogin = (role: 'author' | 'reviewer' | 'chair' | 'admin') => {
      login(role);
      onNavigate(
          role === 'author' ? 'author-dashboard' :
          role === 'reviewer' ? 'reviewer-dashboard' :
          role === 'chair' ? 'chair-dashboard' : 'admin-dashboard'
      );
  }

  return (
    <div className="flex flex-col items-center justify-center grow py-12 px-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md bg-white dark:bg-card-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
            <div className="size-12 text-primary mx-auto mb-4">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4ZM14 32C14 30.9 14.9 30 16 30H32C33.1 30 34 30.9 34 32V34H14V32ZM24 26C21.79 26 20 24.21 20 22C20 19.79 21.79 18 24 18C26.21 18 28 19.79 28 22C28 24.21 26.21 26 24 26ZM34 16H14V14H34V16Z" fill="currentColor"></path>
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mb-1">Chào mừng trở lại</h2>
            <p className="text-text-sec-light dark:text-text-sec-dark text-sm">Đăng nhập vào hệ thống quản lý hội nghị</p>
        </div>

        {/* Form */}
        <div className="px-8 pb-8">
            <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="email">Email</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec-light">
                            <span className="material-symbols-outlined text-[20px]">mail</span>
                        </span>
                        <input 
                            id="email"
                            type="email" 
                            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="name@example.com"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-text-main-light dark:text-text-main-dark" htmlFor="password">Mật khẩu</label>
                        <a href="#" className="text-xs font-medium text-primary hover:text-primary-hover">Quên mật khẩu?</a>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec-light">
                            <span className="material-symbols-outlined text-[20px]">lock</span>
                        </span>
                        <input 
                            id="password"
                            type="password" 
                            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full h-11 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md hover:shadow-lg transition-all mt-2"
                >
                    Đăng nhập
                </button>

                {/* Demo Links */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border-light dark:border-border-dark">
                  <span className="text-xs text-center text-text-sec-light uppercase tracking-wider font-bold">Demo Quick Login</span>
                  <div className="grid grid-cols-4 gap-2">
                    <button type="button" onClick={() => handleDemoLogin('author')} className="text-[10px] py-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200">Author</button>
                    <button type="button" onClick={() => handleDemoLogin('reviewer')} className="text-[10px] py-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200">Reviewer</button>
                    <button type="button" onClick={() => handleDemoLogin('chair')} className="text-[10px] py-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200">Chair</button>
                    <button type="button" onClick={() => handleDemoLogin('admin')} className="text-[10px] py-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200">Admin</button>
                  </div>
                </div>

            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-text-sec-light dark:text-text-sec-dark">
                    Chưa có tài khoản?{" "}
                    <button onClick={() => onNavigate('register')} className="font-semibold text-primary hover:text-primary-hover transition-colors">Đăng ký ngay</button>
                </p>
            </div>
        </div>

        {/* Footer of Card */}
        <div className="px-8 py-4 bg-gray-50 dark:bg-background-dark/50 border-t border-border-light dark:border-border-dark text-center">
             <p className="text-xs text-text-sec-light dark:text-text-sec-dark">Được bảo vệ bởi reCAPTCHA và tuân theo Chính sách bảo mật.</p>
        </div>
      </div>
    </div>
  );
};