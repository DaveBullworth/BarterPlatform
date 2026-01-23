// DTO для запроса
export interface PasswordResetRequestDto {
  email: string;
}

// DTO для ответа
export interface PasswordResetRequestResponseDto {
  result: 'sent' | 'already_requested';
  waitHours?: number;
}

export interface PasswordResetConfirmDto {
  token: string;
  newPassword: string;
}

export interface PasswordResetConfirmResponseDto {
  success: true;
}
