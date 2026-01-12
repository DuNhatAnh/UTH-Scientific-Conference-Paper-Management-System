import apiClient, { ApiResponse, MOCK_MODE } from './apiClient';

// DTOs
export interface ConferenceDto {
  id: number;
  name: string;
  shortName?: string;
  description?: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  reviewDeadline?: string;
  notificationDate?: string;
  cameraReadyDeadline?: string;
  status: string;
  location?: string;
  website?: string;
  createdAt: string;
}

export interface ConferenceDetailDto extends ConferenceDto {
  tracks: TrackDto[];
  topics: TopicDto[];
  committeeMembers: CommitteeMemberDto[];
  totalSubmissions: number;
  acceptedSubmissions: number;
}

export interface TrackDto {
  id: number;
  name: string;
  description?: string;
}

export interface TopicDto {
  id: number;
  name: string;
  description?: string;
}

export interface CommitteeMemberDto {
  id: number;
  userId: number;
  userName: string;
  role: string;
  affiliation?: string;
}

export interface CreateConferenceRequest {
  name: string;
  shortName?: string;
  description?: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  reviewDeadline?: string;
  notificationDate?: string;
  cameraReadyDeadline?: string;
  location?: string;
  website?: string;
}

// Mock topics data
const MOCK_TOPICS: TopicDto[] = [
  { id: 1, name: 'Artificial Intelligence', description: 'AI, Machine Learning, Deep Learning' },
  { id: 2, name: 'Energy Systems', description: 'Smart Grid, Renewable Energy' },
  { id: 3, name: 'IoT & Embedded Systems', description: 'Internet of Things, Sensors' },
  { id: 4, name: 'Blockchain & Security', description: 'Distributed Systems, Cybersecurity' },
  { id: 5, name: 'Data Science', description: 'Big Data, Data Analytics' },
];

// Conference API
export const conferenceApi = {
  getConferences: async (
    status?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<ConferenceDto[]>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    const response = await apiClient.get<ApiResponse<ConferenceDto[]>>(`/api/conferences?${params}`);
    return response.data;
  },

  getConference: async (conferenceId: number): Promise<ApiResponse<ConferenceDetailDto>> => {
    const response = await apiClient.get<ApiResponse<ConferenceDetailDto>>(`/api/conferences/${conferenceId}`);
    return response.data;
  },

  createConference: async (data: CreateConferenceRequest): Promise<ApiResponse<ConferenceDto>> => {
    const response = await apiClient.post<ApiResponse<ConferenceDto>>('/api/conferences', data);
    return response.data;
  },

  updateConference: async (conferenceId: number, data: Partial<CreateConferenceRequest>): Promise<ApiResponse<ConferenceDto>> => {
    const response = await apiClient.put<ApiResponse<ConferenceDto>>(`/api/conferences/${conferenceId}`, data);
    return response.data;
  },

  deleteConference: async (conferenceId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/conferences/${conferenceId}`);
    return response.data;
  },

  // Tracks
  getTracks: async (conferenceId: number): Promise<ApiResponse<TrackDto[]>> => {
    const response = await apiClient.get<ApiResponse<TrackDto[]>>(`/api/conferences/${conferenceId}/tracks`);
    return response.data;
  },

  // Topics
  getTopics: async (conferenceId: number): Promise<ApiResponse<TopicDto[]>> => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return { success: true, data: MOCK_TOPICS };
    }
    const response = await apiClient.get<ApiResponse<TopicDto[]>>(`/api/conferences/${conferenceId}/topics`);
    return response.data;
  },
};

export default conferenceApi;
