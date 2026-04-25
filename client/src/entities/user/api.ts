import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { $authHost } from '@/shared/api';
import {
  SelfUserSchema,
  AdminUserSchema,
  PublicUserSchema,
  UpdateSelfUserSchema,
  UpdateAdminUserSchema,
  type SelfUser,
  type AnyUser,
  type UpdateSelfUserDto,
  type UpdateAdminUserDto,
} from './model';
import { AVATAR_BASE_URL } from '@/shared/constants/avatar-base-url';
import { createEtagBuilder } from '@/shared/lib/';

// функция-строитель ETag из фабрики
const toUserEtag = createEtagBuilder('user');

export const userKeys = {
  self: () => ['user', 'self'] as const,
  byId: (id: string) => ['user', id] as const,
};

// Fetchers

const fetchSelfUser = async (updatedAt?: string): Promise<SelfUser> => {
  const etag = toUserEtag(updatedAt);
  const { data } = await $authHost.get('/user/self', {
    headers: etag ? { 'If-None-Match': etag } : undefined,
  });
  return SelfUserSchema.parse(data);
};

const fetchUserById = async (
  id: string,
  updatedAt?: string,
): Promise<AnyUser> => {
  const etag = toUserEtag(updatedAt);
  const { data } = await $authHost.get(`/user/${id}`, {
    headers: etag ? { 'If-None-Match': etag } : undefined,
  });

  // Пробуем распарсить от наиболее к наименее детальному
  const adminResult = AdminUserSchema.safeParse(data);
  if (adminResult.success) return adminResult.data;

  const selfResult = SelfUserSchema.safeParse(data);
  if (selfResult.success) return selfResult.data;

  return PublicUserSchema.parse(data);
};

// Хуки

export const useSelfUser = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: userKeys.self(),
    queryFn: () => {
      // Берём updatedAt из того что уже есть в кеше
      const cached = queryClient.getQueryData<SelfUser>(userKeys.self());
      return fetchSelfUser(cached?.updatedAt);
    },
    enabled: Boolean(localStorage.getItem('accessToken')),
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

export const useUserById = (id: string | undefined) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: userKeys.byId(id!),
    queryFn: () => {
      // Берём updatedAt из того что уже есть в кеше
      const cached = queryClient.getQueryData<AnyUser>(userKeys.byId(id!));
      return fetchUserById(id!, cached?.updatedAt);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
};

// Мутации

export const useUpdateSelfUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateSelfUserDto) => {
      const validated = UpdateSelfUserSchema.parse(dto);
      const { data } = await $authHost.patch('/user/self', validated);
      return SelfUserSchema.parse(data);
    },
    onSuccess: (updatedUser) => {
      // Обновляем кеш — компонент перерендерится автоматически
      queryClient.setQueryData(userKeys.self(), updatedUser);
    },
  });
};

export const useUpdateUserByAdmin = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateAdminUserDto) => {
      const validated = UpdateAdminUserSchema.parse(dto);
      const { data } = await $authHost.patch(`/user/${userId}`, validated);
      return AdminUserSchema.parse(data);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userKeys.byId(userId), updatedUser);
    },
  });
};

// Avatar — отдельные мутации, изолированные от основных данных пользователя

export const getUserAvatarUrl = (userId: string, version?: number): string =>
  version
    ? `${AVATAR_BASE_URL}/${userId}?v=${version}`
    : `${AVATAR_BASE_URL}/${userId}`;

export const useUploadAvatar = (userId?: string) => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const url = userId ? `/media/avatar?userId=${userId}` : '/media/avatar';
      const { data } = await $authHost.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data as { message: string };
    },
  });
};

export const useDeleteAvatar = (userId?: string) => {
  return useMutation({
    mutationFn: async () => {
      const url = userId ? `/media/avatar?userId=${userId}` : '/media/avatar';
      const { data } = await $authHost.delete(url);
      return data as { message: string };
    },
  });
};
