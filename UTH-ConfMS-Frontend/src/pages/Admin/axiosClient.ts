import axios from 'axios';

// Cấu hình Base URL trỏ về Ocelot API Gateway (Port 5000)
const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho Request: Tự động đính kèm Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Interceptor cho Response: Xử lý lỗi toàn cục (ví dụ: 401 Unauthorized)
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Trả về data trực tiếp để tiện sử dụng
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('token');
      // Có thể redirect về trang login hoặc dispatch logout action
      // window.location.href = '/login'; 
    }
    // Ném lỗi ra để component xử lý hiển thị thông báo
    return Promise.reject(error);
  }
);

export default axiosClient;