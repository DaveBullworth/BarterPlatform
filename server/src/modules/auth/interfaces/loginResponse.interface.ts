export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken?: string;
}
