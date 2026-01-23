import apiClient, { ApiResponse, MOCK_MODE, PagedResponse } from './apiClient';

// DTOs
export interface ConferenceDto {
    conferenceId: string;
    name: string;
    acronym: string;
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
    createdBy: string;
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

export interface CommitteeMemberLegacyDto {
    id: number;
    userId: number;
    userName: string;
    role: string;
    affiliation?: string;
}

export interface CreateConferenceRequest {
    name: string;
    acronym: string;
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

export interface CallForPapersDto {
    cfpId: string;
    conferenceId: string;
    title: string;
    content: string;
    submissionGuidelines?: string;
    formattingRequirements?: string;
    minPages?: number;
    maxPages?: number;
    isPublished: boolean;
    publishedAt?: string;
}

export interface UpdateCallForPapersRequest {
    title?: string;
    content?: string;
    submissionGuidelines?: string;
    formattingRequirements?: string;
    minPages?: number;
    maxPages?: number;
    isPublished?: boolean;
}

// Mock topics data
const MOCK_TOPICS: TopicDto[] = [
    { id: 1, name: 'Artificial Intelligence', description: 'AI, Machine Learning, Deep Learning' },
    { id: 2, name: 'Energy Systems', description: 'Smart Grid, Renewable Energy' },
    { id: 3, name: 'IoT & Embedded Systems', description: 'Internet of Things, Sensors' },
    { id: 4, name: 'Blockchain & Security', description: 'Distributed Systems, Cybersecurity' },
    { id: 5, name: 'Data Science', description: 'Big Data, Data Analytics' },
];

export const conferenceApi = {
    getConferences: async (
        status?: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<ApiResponse<PagedResponse<ConferenceDto>>> => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());

        const response = await apiClient.get<ApiResponse<PagedResponse<ConferenceDto>>>(`/api/conferences?${params}`);
        return response.data;
    },

    getConference: async (conferenceId: string): Promise<ApiResponse<ConferenceDetailDto>> => {
        const response = await apiClient.get<ApiResponse<ConferenceDetailDto>>(`/api/conferences/${conferenceId}`);
        return response.data;
    },

    createConference: async (data: CreateConferenceRequest): Promise<ApiResponse<ConferenceDto>> => {
        const response = await apiClient.post<ApiResponse<ConferenceDto>>('/api/conferences', data);
        return response.data;
    },

    updateConference: async (conferenceId: string, data: Partial<CreateConferenceRequest>): Promise<ApiResponse<ConferenceDto>> => {
        const response = await apiClient.put<ApiResponse<ConferenceDto>>(`/api/conferences/${conferenceId}`, data);
        return response.data;
    },

    deleteConference: async (conferenceId: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete<ApiResponse<void>>(`/api/conferences/${conferenceId}`);
        return response.data;
    },

    // Tracks
    getTracks: async (conferenceId: string): Promise<ApiResponse<TrackDto[]>> => {
        const response = await apiClient.get<ApiResponse<TrackDto[]>>(`/api/conferences/${conferenceId}/tracks`);
        return response.data;
    },

    // Topics
    getTopics: async (conferenceId: string): Promise<ApiResponse<TopicDto[]>> => {
        if (MOCK_MODE) {
            await new Promise(resolve => setTimeout(resolve, 200));
            return { success: true, data: MOCK_TOPICS };
        }
        const response = await apiClient.get<ApiResponse<TopicDto[]>>(`/api/conferences/${conferenceId}/topics`);
        return response.data;
    },

    // Call for Papers
    getCallForPapers: async (conferenceId: string): Promise<ApiResponse<CallForPapersDto>> => {
        const response = await apiClient.get<ApiResponse<CallForPapersDto>>(`/api/conferences/${conferenceId}/cfp`);
        return response.data;
    },

    updateCallForPapers: async (conferenceId: string, data: UpdateCallForPapersRequest): Promise<ApiResponse<CallForPapersDto>> => {
        const response = await apiClient.put<ApiResponse<CallForPapersDto>>(`/api/conferences/${conferenceId}/cfp`, data);
        return response.data;
    },

    // Committee Members
    getCommitteeMembers: async (conferenceId: string): Promise<ApiResponse<CommitteeMemberDto[]>> => {
        const response = await apiClient.get<ApiResponse<CommitteeMemberDto[]>>(`/api/conferences/${conferenceId}/members`);
        return response.data;
    },

    addCommitteeMember: async (conferenceId: string, userId: string, role: string = 'REVIEWER'): Promise<ApiResponse<CommitteeMemberDto>> => {
        const response = await apiClient.post<ApiResponse<CommitteeMemberDto>>(`/api/conferences/${conferenceId}/members`, { userId, role });
        return response.data;
    },

    removeCommitteeMember: async (conferenceId: string, userId: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete<ApiResponse<void>>(`/api/conferences/${conferenceId}/members/${userId}`);
        return response.data;
    },
};

export interface CommitteeMemberDto {
    memberId: string; // GUID
    conferenceId: string;
    userId: string; // GUID
    role: string;
    fullName?: string;
    email?: string;
    createdAt: string;
}

export interface CommitteeMemberLegacyDto { // Renaming old one to avoid conflict if used elsewhere, or just update it
    id: number;
    userId: number;
    userName: string;
    role: string;
    affiliation?: string;
}

export default conferenceApi;