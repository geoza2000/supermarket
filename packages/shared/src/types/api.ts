// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  firestore: {
    status: 'ok' | 'error';
    latencyMs?: number;
    error?: string;
  };
}