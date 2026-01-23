import { $host } from './index';
import type { ResendConfirmEmailDto } from '@/types/email.confirm.dto';

export const confirmEmail = async (token: string) => {
  const { data } = await $host.get('/mail-confirm/confirm-email', {
    params: { token },
  });

  return data;
};

export const resendConfirmEmail = async (dto: ResendConfirmEmailDto) => {
  const { data } = await $host.post('/mail-confirm/resend', dto);
  return data;
};
