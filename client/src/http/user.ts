import { $host, $authHost } from './index';
import type {
  SelfUserDto,
  LoginDto,
  LoginResponse,
  RegisterUserDto,
  RegisterResponse,
} from '@/types/user';

export const getSelfUser = async (): Promise<SelfUserDto> => {
  const { data } = await $authHost.get<SelfUserDto>('/user/self');
  return data;
};

export const loginUser = async (dto: LoginDto): Promise<LoginResponse> => {
  const { data } = await $host.post<LoginResponse>('/auth/login', dto);
  return data;
};

export const registerUser = async (
  dto: RegisterUserDto,
): Promise<RegisterResponse> => {
  const { data } = await $host.post<RegisterResponse>('/user/register', dto);
  return data;
};
