export interface ApiListResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
