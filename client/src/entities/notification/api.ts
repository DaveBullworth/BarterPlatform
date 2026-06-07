import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { $authHost } from '@/shared/api';
import {
  NotificationListSchema,
  UnreadCountSchema,
  type NotificationList,
} from './model';

const API_URL = import.meta.env.VITE_API_URL as string;

type ListParams = { page: number; limit: number; onlyUnread: boolean };

export const notificationKeys = {
  all: () => ['notifications'] as const,
  lists: () => [...notificationKeys.all(), 'list'] as const,
  list: (params: ListParams) => [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all(), 'unread-count'] as const,
};

export const notificationApi = {
  getList: async (params: ListParams): Promise<NotificationList> => {
    const { data } = await $authHost.get('/notifications', { params });
    return NotificationListSchema.parse(data);
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await $authHost.get('/notifications/unread-count');
    return UnreadCountSchema.parse(data).count;
  },

  markRead: async (id: string): Promise<void> => {
    await $authHost.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await $authHost.patch('/notifications/read-all');
  },
};

export const useNotifications = (
  params: { page?: number; limit?: number; onlyUnread?: boolean },
  enabled = true,
) => {
  const normalized: ListParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    onlyUnread: params.onlyUnread ?? false,
  };
  return useQuery({
    queryKey: notificationKeys.list(normalized),
    queryFn: () => notificationApi.getList(normalized),
    enabled,
    staleTime: 1000 * 15,
  });
};

export const useUnreadCount = (enabled = true) =>
  useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationApi.getUnreadCount,
    enabled,
    staleTime: 1000 * 30,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() });
    },
  });
};

type StreamEvent =
  | { kind: 'notification:new' }
  | { kind: 'notification:unread'; unreadCount: number }
  | { kind: 'ping' };

/**
 * Подключает один SSE-стрим уведомлений на сессию. EventSource не умеет слать
 * заголовки, поэтому токен идёт через ?token=. На ошибке переподключаемся,
 * каждый раз читая СВЕЖИЙ токен из localStorage.
 */
export const useNotificationsStream = (enabled: boolean) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      source = new EventSource(
        `${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`,
      );

      source.onmessage = (e: MessageEvent<string>) => {
        try {
          const event = JSON.parse(e.data) as StreamEvent;
          if (event.kind === 'notification:new') {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
          } else if (event.kind === 'notification:unread') {
            queryClient.setQueryData(
              notificationKeys.unreadCount(),
              event.unreadCount,
            );
          }
        } catch {
          /* пропускаем некорректный пейлоад */
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (!closed) retry = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      closed = true;
      source?.close();
      if (retry) clearTimeout(retry);
    };
  }, [enabled, queryClient]);
};
