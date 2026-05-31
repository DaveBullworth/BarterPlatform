import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { $authHost } from '@/shared/api';
import {
  UserPreferencesListSchema,
  type UserPreference,
  type UserPreferencesList,
} from './model';

const PREFERENCES_PATH = '/user-preferences/me';

export const userPreferencesKeys = {
  all: () => ['userPreferences'] as const,
  me: () => ['userPreferences', 'me'] as const,
};

export const userPreferencesApi = {
  getMine: async (): Promise<UserPreferencesList> => {
    const { data } = await $authHost.get(PREFERENCES_PATH);
    return UserPreferencesListSchema.parse(data);
  },

  replaceMine: async (
    items: UserPreference[],
  ): Promise<UserPreferencesList> => {
    const { data } = await $authHost.put(PREFERENCES_PATH, { items });
    return UserPreferencesListSchema.parse(data);
  },

  resetMine: async (): Promise<{ success: true }> => {
    const { data } = await $authHost.delete<{ success: true }>(
      PREFERENCES_PATH,
    );
    return data;
  },

  selectAllMine: async (): Promise<UserPreferencesList> => {
    const { data } = await $authHost.post(`${PREFERENCES_PATH}/select-all`);
    return UserPreferencesListSchema.parse(data);
  },
};

/** Достаёт текущие предпочтения; держится в кэше пока пользователь авторизован. */
export const useUserPreferences = (enabled = true) => {
  return useQuery({
    queryKey: userPreferencesKeys.me(),
    queryFn: userPreferencesApi.getMine,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
};

export const useReplaceUserPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: UserPreference[]) =>
      userPreferencesApi.replaceMine(items),
    onSuccess: (data) => {
      queryClient.setQueryData(userPreferencesKeys.me(), data);
    },
  });
};

export const useResetUserPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userPreferencesApi.resetMine(),
    onSuccess: () => {
      queryClient.setQueryData(userPreferencesKeys.me(), {
        items: [],
      } satisfies UserPreferencesList);
    },
  });
};

export const useSelectAllUserPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userPreferencesApi.selectAllMine(),
    onSuccess: (data) => {
      queryClient.setQueryData(userPreferencesKeys.me(), data);
    },
  });
};
