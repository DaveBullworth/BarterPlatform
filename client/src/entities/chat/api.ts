import { useEffect, useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { $authHost } from '@/shared/api';
import {
  ChatAttachmentSchema,
  ChatMessageSchema,
  ChatMessagesPageSchema,
  ChatUnreadByOfferSchema,
  ChatUnreadCountSchema,
  type ChatAttachment,
  type ChatMessage,
  type ChatMessagesPage,
  type ChatUnreadByOffer,
} from './model';

const CHAT_PAGE_SIZE = 30;

export const chatKeys = {
  all: () => ['chat'] as const,
  messages: (offerId: string) => [...chatKeys.all(), 'messages', offerId] as const,
  unread: () => [...chatKeys.all(), 'unread'] as const,
  unreadByOffer: () => [...chatKeys.all(), 'unread-by-offer'] as const,
  attachment: (offerId: string, id: string) =>
    [...chatKeys.all(), 'attachment', offerId, id] as const,
};

export const chatApi = {
  getMessages: async (
    offerId: string,
    params?: { before?: string; limit?: number },
  ): Promise<ChatMessagesPage> => {
    const { data } = await $authHost.get(`/chat/offers/${offerId}/messages`, {
      params,
    });
    return ChatMessagesPageSchema.parse(data);
  },

  sendMessage: async (
    offerId: string,
    body: { text?: string; attachmentIds?: string[] },
  ): Promise<ChatMessage> => {
    const { data } = await $authHost.post(
      `/chat/offers/${offerId}/messages`,
      body,
    );
    return ChatMessageSchema.parse(data);
  },

  uploadAttachment: async (
    offerId: string,
    file: File,
  ): Promise<ChatAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await $authHost.post(
      `/chat/offers/${offerId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return ChatAttachmentSchema.parse(data);
  },

  markRead: async (offerId: string): Promise<void> => {
    await $authHost.post(`/chat/offers/${offerId}/read`);
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await $authHost.get('/chat/unread-count');
    return ChatUnreadCountSchema.parse(data).count;
  },

  getUnreadByOffer: async (): Promise<ChatUnreadByOffer> => {
    const { data } = await $authHost.get('/chat/unread/by-offer');
    return ChatUnreadByOfferSchema.parse(data);
  },

  // Приватные файлы недоступны через <img src> (нужен Bearer) — тянем blob.
  getAttachmentBlob: async (offerId: string, id: string): Promise<Blob> => {
    const { data } = await $authHost.get(
      `/chat/offers/${offerId}/file/${id}`,
      { responseType: 'blob' },
    );
    return data as Blob;
  },
};

/**
 * Сообщения диалога. История подгружается простым ростом окна (`limit`): сервер
 * отдаёт последние N в хронологическом порядке, новые приходят снизу. Для чата
 * (короткие диалоги) это проще и надёжнее курсоров, а SSE-инвалидация дотягивает
 * свежие сообщения в текущее окно.
 */
export const useChatMessages = (offerId: string | undefined, enabled = true) => {
  const [limit, setLimit] = useState(CHAT_PAGE_SIZE);

  const query = useQuery({
    queryKey: [...chatKeys.messages(offerId ?? 'none'), limit],
    queryFn: () => chatApi.getMessages(offerId!, { limit }),
    enabled: Boolean(offerId) && enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 10,
  });

  return {
    messages: query.data?.data ?? [],
    hasMore: query.data?.hasMore ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    loadOlder: () => setLimit((value) => value + CHAT_PAGE_SIZE),
  };
};

export const useSendChatMessage = (offerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { text?: string; attachmentIds?: string[] }) =>
      chatApi.sendMessage(offerId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(offerId) });
    },
  });
};

export const useUploadChatAttachment = (offerId: string) =>
  useMutation({
    mutationFn: (file: File) => chatApi.uploadAttachment(offerId, file),
  });

export const useMarkChatRead = (offerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.markRead(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.unread() });
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadByOffer() });
    },
  });
};

export const useChatUnreadCount = (enabled = true) =>
  useQuery({
    queryKey: chatKeys.unread(),
    queryFn: chatApi.getUnreadCount,
    enabled,
    staleTime: 1000 * 30,
  });

/** Возвращает карту offerId → число непрочитанных (для бейджей карточек). */
export const useChatUnreadByOffer = (enabled = true) =>
  useQuery({
    queryKey: chatKeys.unreadByOffer(),
    queryFn: chatApi.getUnreadByOffer,
    enabled,
    staleTime: 1000 * 30,
    select: (items): Record<string, number> =>
      Object.fromEntries(items.map((i) => [i.offerId, i.unread])),
  });

/**
 * Object URL для приватного вложения (изображения): тянет blob через $authHost
 * и создаёт временный URL, освобождая его при размонтировании.
 */
export const useChatAttachmentUrl = (
  offerId: string,
  attachmentId: string,
  enabled = true,
) => {
  const query = useQuery({
    queryKey: chatKeys.attachment(offerId, attachmentId),
    queryFn: () => chatApi.getAttachmentBlob(offerId, attachmentId),
    enabled,
    staleTime: Infinity,
  });

  // URL выводится из blob (без setState в эффекте); эффект только освобождает его.
  const url = useMemo(
    () => (query.data ? URL.createObjectURL(query.data) : null),
    [query.data],
  );
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
};
