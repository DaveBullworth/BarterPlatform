import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { $authHost } from '@/shared/api';
import { SessionListSchema, type Session } from './model';

export const sessionKeys = {
  all: () => ['sessions'] as const,
  own: () => [...sessionKeys.all(), 'own'] as const,
  ofUser: (userId: string) => [...sessionKeys.all(), 'user', userId] as const,
};

// userId не задан → свои сессии (/sessions); иначе админский путь к чужим.
const basePath = (userId?: string) =>
  userId ? `/sessions/users/${userId}` : '/sessions';

export const sessionApi = {
  list: async (userId?: string): Promise<Session[]> => {
    const { data } = await $authHost.get(basePath(userId));
    return SessionListSchema.parse(data);
  },

  terminate: async (sessionId: string, userId?: string): Promise<void> => {
    await $authHost.delete(`${basePath(userId)}/${sessionId}`);
  },

  terminateOthers: async (userId?: string): Promise<void> => {
    await $authHost.delete(basePath(userId));
  },
};

const keyFor = (userId?: string) =>
  userId ? sessionKeys.ofUser(userId) : sessionKeys.own();

export const useSessions = (userId?: string) =>
  useQuery({
    queryKey: keyFor(userId),
    queryFn: () => sessionApi.list(userId),
    staleTime: 1000 * 30,
  });

export const useTerminateSession = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionApi.terminate(sessionId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keyFor(userId) }),
  });
};

export const useTerminateOtherSessions = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sessionApi.terminateOthers(userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keyFor(userId) }),
  });
};
