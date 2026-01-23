import apiClient, { ApiResponse, PagedResponse } from './apiClient';
import { UserDto } from './authApi';

export const identityApi = {
    searchUsers: async (query: string, page: number = 1, pageSize: number = 20): Promise<ApiResponse<PagedResponse<UserDto>>> => {
        const params = new URLSearchParams();
        params.append('query', query);
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());

        const response = await apiClient.get<ApiResponse<PagedResponse<UserDto>>>(`/api/users/search?${params}`);
        return response.data;
    },

    getUser: async (userId: string): Promise<ApiResponse<UserDto>> => {
        const response = await apiClient.get<ApiResponse<UserDto>>(`/api/users/${userId}`);
        return response.data;
    }
};

export default identityApi;
