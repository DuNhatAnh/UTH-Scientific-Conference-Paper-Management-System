import axiosClient from './axiosClient';

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: string; // Backend trả về string raw (ví dụ: "SystemAdmin")
  isActive: boolean;
  createdAt: string; // Rename to match backend property
}

export const userApi = {
  // Lấy danh sách tất cả người dùng
  getAllUsers: async () => {
    return axiosClient.get<any, UserDto[]>('/users');
  },

  // Tạo người dùng mới
  createUser: async (data: any) => {
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  // Cập nhật trạng thái hoặc role người dùng
  updateUser: async (id: string, data: Partial<UserDto>) => {
    return axiosClient.put(`/users/${id}`, data);
  },

  // Xóa người dùng
  deleteUser: async (id: string) => {
    return axiosClient.delete(`/users/${id}`);
  },
  //cập nhật role người dùng
  assignRole: async (data: { userId: string; roleName: string; roleId?: string }) => {
    // Cập nhật endpoint chính xác theo UsersController: POST /api/users/{userId}/roles
    // Gửi kèm đầy đủ thông tin để đảm bảo Backend nhận được (dù DTO yêu cầu RoleName hay RoleId)
    return axiosClient.post(`/users/${data.userId}/roles`, {
      roleName: data.roleName,      // camelCase
      RoleName: data.roleName,      // PascalCase
      role: data.roleName,          // Fallback
      roleId: data.roleId,          // ID nếu backend cần
      RoleId: data.roleId           // PascalCase ID
    });
  },

  // Xóa role của người dùng
  removeRole: async (data: { userId: string; roleName: string; roleId?: string }) => {
    // Backend đã chuyển sang POST /users/{userId}/roles/remove để tránh lỗi 403/DELETE body
    return axiosClient.post(`/users/${data.userId}/roles/remove`, {
      userId: data.userId,
      UserId: data.userId,
      roleName: data.roleName,
      RoleName: data.roleName,
      role: data.roleName,
      roleId: data.roleId,
      RoleId: data.roleId
    });
  },

  // Set/Replace role cho user (Atomic)
  setUserRole: async (data: { userId: string; roleName: string; roleId?: string }) => {
    return axiosClient.put(`/users/${data.userId}/roles`, {
      roleName: data.roleName,
      roleId: data.roleId,
      userId: data.userId  // REQUIRED by Backend DTO [Required] public Guid UserId { get; set; }
    });
  },
};