
// Mock API service
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export const mockFetch = async <T>(data: T, shouldFail = false): Promise<ApiResponse<T>> => {
  await delay(800); // Simulate network latency
  if (shouldFail) {
    throw new Error('Network error or server error');
  }
  return {
    data,
    success: true,
  };
};
