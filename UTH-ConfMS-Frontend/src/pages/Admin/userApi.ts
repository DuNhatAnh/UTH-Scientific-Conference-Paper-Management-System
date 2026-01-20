import axiosClient from './axiosClient';

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: string; // Backend trả về string raw (ví dụ: "SystemAdmin")
  isActive: boolean;
  createdOn: string;
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
};