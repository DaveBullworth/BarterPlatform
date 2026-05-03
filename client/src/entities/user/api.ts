import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { $host, $authHost, type PaginatedResponse } from '@/shared/api';
import {
  SelfUserSchema,
  AdminUserSchema,
  PublicUserSchema,
  type SelfUser,
  type AdminUser,
  type AnyUser,
  type UpdateSelfUserDto,
} from './model';
import { createEtagBuilder } from '@/shared/lib';

const toUserEtag = createEtagBuilder('user');

export const userKeys = {
  self: () => ['user', 'self'] as const,
  byId: (id: string) => ['user', id] as const,
};

// Fetcher-ы

export const userApi = {
  getSelf: async (updatedAt?: string): Promise<SelfUser> => {
    const etag = toUserEtag(updatedAt);
    const { data } = await $authHost.get('/user/self', {
      headers: etag ? { 'If-None-Match': etag } : undefined,
    });
    return SelfUserSchema.parse(data);
  },

  getById: async (id: string, updatedAt?: string): Promise<AnyUser> => {
    const etag = toUserEtag(updatedAt);
    const { data } = await $authHost.get(`/user/${id}`, {
      headers: etag ? { 'If-None-Match': etag } : undefined,
    });

    const adminResult = AdminUserSchema.safeParse(data);
    if (adminResult.success) return adminResult.data;

    const selfResult = SelfUserSchema.safeParse(data);
    if (selfResult.success) return selfResult.data;

    return PublicUserSchema.parse(data);
  },

  getAll: async (
    params: {
      page?: number;
      limit?: number;
      sorting?: string;
      filters?: string;
    },
    signal?: AbortSignal,
  ) => {
    const { data } = await $authHost.get<PaginatedResponse<AdminUser>>(
      '/user',
      { params, signal },
    );
    return data;
  },

  updateSelf: async (dto: Record<string, unknown>): Promise<SelfUser> => {
    const { data } = await $authHost.patch('/user/self', dto);
    return SelfUserSchema.parse(data);
  },

  updateByAdmin: async (
    id: string,
    dto: Record<string, unknown>,
  ): Promise<AdminUser> => {
    const { data } = await $authHost.patch(`/user/${id}`, dto);
    return AdminUserSchema.parse(data);
  },

  uploadAvatar: async (file: File, userId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const url = userId ? `/media/avatar?userId=${userId}` : '/media/avatar';
    const { data } = await $authHost.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as { message: string };
  },

  deleteAvatar: async (userId?: string) => {
    const url = userId ? `/media/avatar?userId=${userId}` : '/media/avatar';
    const { data } = await $authHost.delete(url);
    return data as { message: string };
  },

  login: async (dto: {
    loginOrEmail: string;
    password: string;
    remember: boolean;
  }) => {
    const { data } = await $host.post<{ accessToken: string }>(
      '/auth/login',
      dto,
    );
    return data.accessToken;
  },

  register: async (dto: Record<string, unknown>) => {
    await $host.post('/user/register', dto);
  },

  logout: async () => {
    await $authHost.post('/auth/logout');
  },

  requestDeactivation: async () => {
    const { data } = await $authHost.post<{
      result: string;
      waitHours?: number;
    }>('/deactivation/request');
    return data;
  },

  confirmDeactivation: async (code: string) => {
    await $authHost.post('/deactivation/confirm', { code });
  },

  requestPasswordReset: async (email: string) => {
    const { data } = await $host.post<{
      result: string;
      waitHours?: number;
    }>('/password-reset/request', { email });
    return data;
  },

  confirmPasswordReset: async (token: string, newPassword: string) => {
    await $host.post('/password-reset/confirm', { token, newPassword });
  },

  resendConfirmEmail: async (loginOrEmail: string) => {
    await $host.post('/mail-confirm/resend', { loginOrEmail });
  },

  confirmEmail: async (token: string) => {
    await $host.get('/mail-confirm/confirm-email', {
      params: { token },
    });
  },
};

export const getUserAvatarUrl = (userId: string, version?: number): string => {
  const base = `${import.meta.env.VITE_API_URL}/media/avatars/${userId}`;
  return version ? `${base}?v=${version}` : base;
};

// Query хуки — только чтение

export const useSelfUser = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: userKeys.self(),
    queryFn: () => {
      const cached = queryClient.getQueryData<SelfUser>(userKeys.self());
      return userApi.getSelf(cached?.updatedAt);
    },
    enabled: Boolean(localStorage.getItem('accessToken')),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUserById = (id: string | undefined) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: userKeys.byId(id!),
    queryFn: () => {
      const cached = queryClient.getQueryData<AnyUser>(userKeys.byId(id!));
      return userApi.getById(id!, cached?.updatedAt);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
};

// Mutation хуки

export const useUpdateSelfUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateSelfUserDto) => userApi.updateSelf(dto),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userKeys.self(), updatedUser);
    },
  });
};

export const useUploadAvatar = (userId?: string) => {
  return useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(file, userId),
  });
};

export const useDeleteAvatar = (userId?: string) => {
  return useMutation({
    mutationFn: () => userApi.deleteAvatar(userId),
  });
};
