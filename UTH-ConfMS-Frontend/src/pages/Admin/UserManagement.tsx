import React, { useState, useEffect } from 'react';
import { ViewState } from '../../App';
import { UserRole } from '../../contexts/AuthContext';
import { userApi, UserDto } from './userApi';
import { adminApi } from '../../services/admin';

interface UserManagementProps {
  onNavigate: (view: ViewState) => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  originalRole: string;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Hàm map role từ Backend về Frontend (nếu cần thiết, tùy thuộc vào AuthContext)
  const mapBackendRoleToFrontend = (backendRole: string | string[]): UserRole => {
    // Xử lý cả trường hợp role là string hoặc mảng string (nếu backend trả về danh sách roles)
    const roles = Array.isArray(backendRole) ? backendRole : [backendRole];
    const upperRoles = roles.map(r => (r || '').toUpperCase());

    if (upperRoles.some(r => r.includes('ADMIN'))) return 'admin';
    if (upperRoles.some(r => r.includes('CHAIR'))) return 'chair';
    if (upperRoles.some(r => r.includes('REVIEWER'))) return 'reviewer';
    
    return 'author';
  };

  // Fetch dữ liệu từ API khi component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch danh sách Roles từ hệ thống
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response: any = await adminApi.getRoles();
        const data = Array.isArray(response) ? response : (response.data || []);
        setAvailableRoles(data);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response: any = await adminApi.getUsers(search);
      console.log("Dữ liệu thực tế từ API:", response); // <--- Kiểm tra dòng này trong F12 > Console

      // Xử lý an toàn: Nếu API trả về { data: [...] } thì lấy .data, nếu là mảng thì lấy trực tiếp
      // Backend trả về PagedResponse: { data: { items: [...] } }
      const data = Array.isArray(response) 
        ? response 
        : (response.data?.items || response.data || response.items || []);

      // Map dữ liệu từ DTO backend sang format hiển thị của Frontend
      const mappedUsers: UserData[] = data.map((u: any) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: mapBackendRoleToFrontend(u.role || u.roles), // Kiểm tra cả role (string) và roles (array)
        originalRole: Array.isArray(u.roles) ? u.roles[0] : (u.role || ''),
        status: 'active',
        joinedDate: new Date(u.createdOn).toLocaleDateString('vi-VN')
      }));
      setUsers(mappedUsers);
    } catch (err: any) {
      console.error("Failed to fetch users", err);
      // Hiển thị thông báo lỗi chi tiết từ Server hoặc Axios
      let message = err.response?.data?.message || err.message || "Không thể tải danh sách người dùng.";
      
      if (err.response && err.response.status === 404) {
        message = "Lỗi 404: Không tìm thấy API '/api/users'. Vui lòng kiểm tra cấu hình Ocelot Gateway hoặc Controller Backend.";
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users;

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: availableRoles[0]?.roleName || 'Author', status: 'active' });
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.originalRole || 'Author', status: user.status });
    setModalError('');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await userApi.deleteUser(id);
        // Cập nhật lại state sau khi xóa thành công
        setUsers(users.filter(u => u.id !== id));
        alert("Xóa thành công!");
      } catch (err) {
        console.error(err);
        alert("Xóa thất bại!");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setModalError('');
    
    // Chuẩn bị dữ liệu gửi đi
    const payload = {
      fullName: formData.name,
      email: formData.email,
      role: formData.role,
      isActive: true,
      // Nếu là tạo mới, backend có thể yêu cầu password mặc định hoặc gửi email kích hoạt
      // password: 'DefaultPassword@123', 
    };

    try {
      if (editingUser) {
        // Gọi API Cập nhật
        await userApi.updateUser(editingUser.id, payload);
        alert("Cập nhật thành công!");
      } else {
        // Gọi API Tạo mới
        await userApi.createUser({ ...payload, password: 'DefaultPassword@123' }); // Giả sử backend cần pass
        alert("Thêm mới thành công!");
      };
      
      // Tải lại danh sách sau khi lưu thành công
      await fetchUsers();
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      // Hiển thị thông báo lỗi chi tiết từ Backend hoặc Axios
      const message = err.response?.data?.message || 
                      (typeof err.response?.data === 'string' ? err.response.data : '') ||
                      err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      setModalError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const classes = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      chair: 'bg-purple-100 text-purple-700 border-purple-200',
      reviewer: 'bg-blue-100 text-blue-700 border-blue-200',
      author: 'bg-green-100 text-green-700 border-green-200',
      public: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${classes[role]}`}>{role}</span>;
  };

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-8 px-5 md:px-10 flex justify-center">
      <div className="w-full max-w-[1200px] flex flex-col gap-6">
        
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button 
              onClick={() => onNavigate('admin-dashboard')}
              className="text-primary text-sm font-medium flex items-center gap-1 hover:underline mb-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span> Quay lại Dashboard
            </button>
            <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">Quản lý người dùng</h1>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">person_add</span> Thêm người dùng mới
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Thống kê User (Dữ liệu thực tế từ DB) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-card-dark p-5 rounded-xl border border-border-light shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-text-sec-light font-medium">Tổng người dùng</p>
              <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mt-1">{users.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <div className="bg-white dark:bg-card-dark p-5 rounded-xl border border-border-light shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-text-sec-light font-medium">Đang hoạt động</p>
              <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark mt-1">
                {users.filter(u => u.status === 'active').length}
              </h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <span className="material-symbols-outlined">how_to_reg</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec-light">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-light bg-background-light dark:bg-background-dark text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select className="px-4 py-2 rounded-lg border border-border-light bg-white dark:bg-background-dark text-sm outline-none">
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="chair">Chair</option>
            <option value="reviewer">Reviewer</option>
            <option value="author">Author</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            <p className="text-text-sec-light mt-2">Đang tải dữ liệu...</p>
          </div>
        ) : (
          /* Table */
          <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-border-light text-xs uppercase text-text-sec-light font-bold">
                    <th className="p-4">STT</th>
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Vai trò</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Ngày tham gia</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="p-4 font-mono text-xs text-text-sec-light">
                          {index + 1}
                        </td>
                        <td className="p-4 font-medium text-text-main-light dark:text-text-main-dark">{user.name}</td>
                        <td className="p-4 text-sm text-text-sec-light">{user.email}</td>
                        <td className="p-4">{getRoleBadge(user.role)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-text-sec-light">{user.joinedDate}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleOpenEdit(user)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors mr-1" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Xóa">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-text-sec-light">Không tìm thấy người dùng nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-border-light flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="font-bold text-lg">{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 material-symbols-outlined">close</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {modalError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm border border-red-200">{modalError}</div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Họ và tên</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vai trò</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary">
                  {availableRoles.length > 0 ? availableRoles.map((r) => (
                    <option key={r.roleId} value={r.roleName}>{r.displayName || r.roleName}</option>
                  )) : (
                    <option value="Author">Author</option>
                  )}
                </select>
              </div>
              <button type="submit" className="mt-2 bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors">
                {editingUser ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};