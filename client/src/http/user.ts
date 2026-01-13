import { $authHost } from './index';
import type { SelfUserDto } from '@/types/user';

export const getSelfUser = async (): Promise<SelfUserDto> => {
  const { data } = await $authHost.get<SelfUserDto>('/user/self');
  return data;
};
