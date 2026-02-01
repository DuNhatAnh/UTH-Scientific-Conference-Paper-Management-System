
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ViewState } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import logo from '../assets/logo.png';

interface NavbarProps {
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinkClass = (path: string) =>
    `text-sm font-medium leading-normal transition-colors cursor-pointer ${isActive(path) ? 'text-primary' : 'hover:text-primary'}`;

  return (
    <div className="sticky top-0 z-50 w-full border-b border-solid border-border-light dark:border-border-dark bg-card-light/95 dark:bg-card-dark/95 backdrop-blur-sm shadow-sm">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-5 md:px-10 lg:px-20 py-3">
          <div className="layout-content-container flex flex-col max-w-[1200px] flex-1">
            <header className="flex items-center justify-between whitespace-nowrap">
              <Link to="/" className="flex items-center gap-4">
                <div className="size-10">
                  <img
                    src={logo}
                    alt="UTH Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-primary">UTH-ConfMS</h2>
              </Link>
              <div className="flex items-center gap-4 lg:gap-8">
                <div className="hidden lg:flex items-center gap-6">
                  <Link to="/" className={navLinkClass('/')}>Trang chủ</Link>
                  <Link to="/conferences" className={navLinkClass('/conferences')}>Hội nghị</Link>
                  <Link to="/call-for-papers" className={navLinkClass('/call-for-papers')}>Kêu gọi báo cáo</Link>
                  <Link to="/about" className={navLinkClass('/about')}>Về chúng tôi</Link>
                </div>

                {user ? (
                  <div className="flex items-center gap-4">
                    <NotificationCenter />
                    <div className="relative">
                      <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-light hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium hidden md:block">{user.name}</span>
                      </button>
                      {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark py-2 flex flex-col z-50">
                          <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
                            <p className="text-xs font-bold text-primary uppercase">{user.roles.join(', ')}</p>
                          </div>
                          <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Hồ sơ cá nhân</Link>
                          {user.roles.includes('author') && <Link to="/author/dashboard" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Dashboard Tác giả</Link>}
                          {user.roles.includes('reviewer') && <Link to="/reviewer/dashboard" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Dashboard Phản biện</Link>}
                          {user.roles.includes('chair') && <Link to="/chair/dashboard" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Dashboard Chủ tọa</Link>}
                          {user.roles.includes('admin') && <Link to="/admin/dashboard" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Dashboard Admin</Link>}

                          <button onClick={() => { logout(); onNavigate('home'); setIsMenuOpen(false) }} className="px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800">Đăng xuất</button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {!isActive('/register') && (
                      <Link
                        to="/register"
                        className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-white border border-border-light hover:bg-gray-50 text-text-main-light text-sm font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm"
                      >
                        <span className="truncate">Đăng ký</span>
                      </Link>
                    )}
                    {!isActive('/login') && (
                      <Link
                        to="/login"
                        className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm"
                      >
                        <span className="truncate">Đăng nhập</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </header>
          </div>
        </div>
      </div >
    </div >
  );
};
