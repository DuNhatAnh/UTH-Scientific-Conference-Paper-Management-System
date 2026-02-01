import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // Đảm bảo đã cài: npm install jwt-decode

// Định nghĩa các Role chuẩn mà Frontend sử dụng
export type UserRole = 'author' | 'reviewer' | 'chair' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole; // Primary role (for backward compatibility)
  roles: UserRole[]; // All roles the user has
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- HÀM HELPER QUAN TRỌNG ---
// Hàm này giúp map các Role từ Backend sang frontend role
const normalizeRole = (backendRole: string): UserRole | null => {
  const upperRole = backendRole.toUpperCase();
  
  if (upperRole.includes('ADMIN')) return 'admin';
  if (upperRole.includes('CHAIR')) return 'chair';
  if (upperRole.includes('REVIEWER') || upperRole.includes('PC_MEMBER')) return 'reviewer';
  if (upperRole.includes('AUTHOR')) return 'author';
  
  return null;
};

// Map all backend roles to frontend roles
const mapToUserRoles = (backendRole: string | string[]): UserRole[] => {
  if (!backendRole) return ['author'];

  // Handle array of roles
  const roleArray = Array.isArray(backendRole) ? backendRole : [backendRole.toString()];
  
  const mappedRoles: UserRole[] = [];
  
  roleArray.forEach(role => {
    const normalized = normalizeRole(role);
    if (normalized && !mappedRoles.includes(normalized)) {
      mappedRoles.push(normalized);
    }
  });
  
  // If no roles mapped, default to author
  return mappedRoles.length > 0 ? mappedRoles : ['author'];
};

// Get primary role based on priority: Admin > Chair > Reviewer > Author
const getPrimaryRole = (roles: UserRole[]): UserRole => {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('chair')) return 'chair';
  if (roles.includes('reviewer')) return 'reviewer';
  return 'author';
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm xử lý Token và set User
  const handleToken = (token: string) => {
    try {
      // 1. Lưu token
      localStorage.setItem('token', token);

      // 2. Giải mã token
      const decoded = jwtDecode<any>(token);

      // 3. Lấy role raw từ token (xử lý trường hợp key role có thể khác nhau)
      const rawRole = decoded.role ||
        decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        'author';

      // 4. Map all roles
      const userRoles = mapToUserRoles(rawRole);
      const primaryRole = getPrimaryRole(userRoles);

      // 5. Mapping Claims sang object User
      const userData: User = {
        id: decoded.nameid || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        email: decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
        name: decoded.unique_name || decoded.name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        role: primaryRole, // Primary role for compatibility
        roles: userRoles, // All roles
      };

      console.log('User decoded with roles:', userData);
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