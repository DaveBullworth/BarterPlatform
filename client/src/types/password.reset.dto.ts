import type { PasswordResetRequest } from '@/shared/constants/password-reset-request';

// DTO для запроса
export interface PasswordResetRequestDto {
  email: string;
}

// DTO для ответа
export interface PasswordResetRequestResponseDto {
  result: PasswordResetRequest;
  waitHours?: number;
}

export interface PasswordResetConfirmDto {
  token: string;
  newPassword: string;
}
