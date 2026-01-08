import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // Đảm bảo đã cài: npm install jwt-decode

export type UserRole = 'author' | 'reviewer' | 'chair' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void; // Login nhận vào token thay vì role
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Interface cho payload của Token giải mã được
interface JwtPayload {
  nameid: string; // Id user
  email: string;
  role: string;
  unique_name: string; // FullName
  exp: number;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm xử lý Token và set User
  const handleToken = (token: string) => {
    try {
      // 1. Lưu token
      localStorage.setItem('token', token);

      // 2. Giải mã token lấy thông tin
      const decoded = jwtDecode<any>(token); // Dùng any để linh hoạt map field

      // Mapping Claims từ BE sang object User của FE
      // Lưu ý: Tên Claim trong token có thể là URI dài hoặc tên ngắn tùy config BE
      const userData: User = {
        id: decoded.nameid || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        email: decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
        name: decoded.unique_name || decoded.name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        // Chuyển role về chữ thường để khớp với UserRole type
        role: (decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'author').toLowerCase() as UserRole,
      };

      setUser(userData);
    } catch (error) {
      console.error("Lỗi giải mã token:", error);
      logout();
    }
  };

  // Check login khi load lại trang
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      handleToken(token);
    }
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    handleToken(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};