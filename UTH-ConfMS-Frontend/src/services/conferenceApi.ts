import axios from 'axios';

// Dựa trên README, Conference Service chạy ở port 5002
const API_URL = 'http://localhost:5002/api/conferences';

export interface CreateConferenceRequest {
    name: string;
    acronym: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
}

const conferenceApi = {
    create: async (data: CreateConferenceRequest) => {
        const token = localStorage.getItem('token');
        
        // Gọi API tạo hội nghị
        const response = await axios.post(API_URL, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Trả về dữ liệu từ backend (theo cấu trúc JSON bạn cung cấp)
        return response.data;
    }
};

export default conferenceApi;