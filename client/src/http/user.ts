import { $host, $authHost } from './index';
import type {
  SelfUserDto,
  AdminUserDto,
  PublicUserDto,
  LoginDto,
  LoginResponse,
  RegisterUserDto,
  RegisterResponse,
  UpdateSelfUserDto,
  AdminUpdateUserDto,
  GetUsersParams,
  PaginatedResponse,
  UserResponseDto,
} from '@/types/user';

const toUserEtag = (updatedAt?: string): string | undefined => {
  if (!updatedAt) return undefined;
  const time = Date.parse(updatedAt);
  if (Number.isNaN(time)) return undefined;
  return `W/"user:${time}"`;
};

export const getSelfUser = async (updatedAt?: string) => {
  const etag = toUserEtag(updatedAt);
  const { data } = await $authHost.get<SelfUserDto>('/user/self', {
    headers: etag ? { 'If-None-Match': etag } : undefined,
  });

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

export const logoutUser = async () => {
  await $authHost.post('/auth/logout');
};

export const updateSelfUser = async (
  dto: UpdateSelfUserDto,
): Promise<SelfUserDto> => {
  const { data } = await $authHost.patch<SelfUserDto>('/user/self', dto);
  return data;
};

export const updateUserByAdmin = async (
  id: string,
  dto: AdminUpdateUserDto,
): Promise<AdminUserDto> => {
  const { data } = await $authHost.patch<AdminUserDto>(`/user/${id}`, dto);
  return data;
};

export const getAllUsers = async (
  params: GetUsersParams,
  signal?: AbortSignal,
): Promise<PaginatedResponse<UserResponseDto>> => {
  const { data } = await $authHost.get<PaginatedResponse<UserResponseDto>>(
    '/user',
    {
      params,
      signal,
    },
  );

  return data;
};

export const getUserById = async (
  id: string,
  updatedAt?: string,
): Promise<SelfUserDto | AdminUserDto | PublicUserDto> => {
  const etag = toUserEtag(updatedAt);
  const { data } = await $authHost.get<
    SelfUserDto | AdminUserDto | PublicUserDto
  >(`/user/${id}`, {
    headers: etag ? { 'If-None-Match': etag } : undefined,
  });

  return data;
};
