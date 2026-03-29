export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

