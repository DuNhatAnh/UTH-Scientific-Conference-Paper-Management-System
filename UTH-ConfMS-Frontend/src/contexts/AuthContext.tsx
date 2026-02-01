import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // Đảm bảo đã cài: npm install jwt-decode
import { authApi } from '../services/authApi';

// Định nghĩa các Role chuẩn mà Frontend sử dụng
export type UserRole = 'author' | 'reviewer' | 'chair' | 'admin';

interface RoleContext {
  roleId?: string;
  roleName: UserRole;
  roleDisplayName?: string;
  conferenceId?: string;
  conferenceName?: string;
  conferenceCode?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole; // Primary role (for backward compatibility)
  roles: UserRole[]; // All roles the user has
  activeRole?: RoleContext; // Current role in specific conference
  availableContexts?: RoleContext[]; // All role contexts available
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  switchRole: (conferenceId: string, roleName: UserRole) => Promise<void>;
  refreshContexts: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasRoleInConference: (conferenceId: string, role: UserRole) => boolean;
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

// Decode JWT token and extract user info with role context
const decodeToken = (token: string): Partial<User> => {
  try {
    const decoded = jwtDecode<any>(token);

    const rawRole = decoded.role ||
      decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      'author';

    const userRoles = mapToUserRoles(rawRole);
    const primaryRole = getPrimaryRole(userRoles);

    return {
      id: decoded.nameid || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      email: decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      name: decoded.unique_name || decoded.name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      role: primaryRole,
      roles: userRoles,
      activeRole: {
        roleId: decoded.RoleId || '',
        roleName: primaryRole,
        roleDisplayName: primaryRole,
        conferenceId: decoded.ConferenceId,
        conferenceName: decoded.ConferenceName,
        conferenceCode: decoded.ConferenceCode
      }
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm xử lý Token và set User
  const handleToken = (token: string) => {
    try {
      // 1. Lưu token
      localStorage.setItem('token', token);

      // 2. Decode token
      const userData = decodeToken(token);
      setUser(userData as User);
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

  // Fetch available role contexts from API
  const fetchAvailableContexts = async () => {
    try {
      const response = await authApi.getAvailableContexts();
      if (response.success && user) {
        setUser({
          ...user,
          availableContexts: response.data.availableContexts
        });
      }
    } catch (error) {
      console.error('Error fetching contexts:', error);
    }
  };

  const login = (token: string) => {
    handleToken(token);
    // Fetch available contexts after login
    setTimeout(() => fetchAvailableContexts(), 100);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const switchRole = async (conferenceId: string, roleName: UserRole) => {
    try {
      const response = await authApi.switchRoleContext(conferenceId, roleName);
      if (response.success) {
        const { accessToken } = response.data;
        localStorage.setItem('token', accessToken);

        const userData = decodeToken(accessToken);
        setUser({
          ...userData,
          availableContexts: user?.availableContexts
        } as User);
      }
    } catch (error) {
      console.error('Error switching role:', error);
      throw error;
    }
  };

  const refreshContexts = async () => {
    await fetchAvailableContexts();
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) || false;
  };

  const hasRoleInConference = (conferenceId: string, role: UserRole): boolean => {
    return user?.availableContexts?.some(
      ctx => ctx.conferenceId === conferenceId && ctx.roleName === role
    ) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      switchRole,
      refreshContexts,
      isAuthenticated: !!user,
      isLoading,
      hasRole,
      hasRoleInConference
    }}>
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