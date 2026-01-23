import { $host } from './index';
import type {
  PasswordResetRequestDto,
  PasswordResetRequestResponseDto,
  PasswordResetConfirmDto,
  PasswordResetConfirmResponseDto,
} from '@/types/password.reset.dto';

export const requestPasswordReset = async (
  dto: PasswordResetRequestDto,
): Promise<PasswordResetRequestResponseDto> => {
  const { data } = await $host.post<PasswordResetRequestResponseDto>(
    '/password-reset/request',
    dto,
  );

  return data;
};

export const confirmPasswordReset = async (
  dto: PasswordResetConfirmDto,
): Promise<PasswordResetConfirmResponseDto> => {
  const { data } = await $host.post<PasswordResetConfirmResponseDto>(
    '/password-reset/confirm',
    dto,
  );

  return data;
};
