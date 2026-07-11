import { z } from 'zod';
import { enumFromObject } from '@/shared/lib';

export const CHAT_ATTACHMENT_KIND = {
  IMAGE: 'image',
  DOCUMENT: 'document',
} as const;

export type ChatAttachmentKind =
  (typeof CHAT_ATTACHMENT_KIND)[keyof typeof CHAT_ATTACHMENT_KIND];

export const ChatAttachmentSchema = z.object({
  id: z.uuid(),
  kind: enumFromObject(CHAT_ATTACHMENT_KIND),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  originalName: z.string(),
  scanStatus: z.string(),
});

export type ChatAttachment = z.infer<typeof ChatAttachmentSchema>;

export const ChatMessageSchema = z.object({
  id: z.uuid(),
  offerId: z.uuid(),
  senderId: z.uuid(),
  isMine: z.boolean(),
  text: z.string().nullable(),
  attachments: z.array(ChatAttachmentSchema),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatMessagesPageSchema = z.object({
  data: z.array(ChatMessageSchema),
  hasMore: z.boolean(),
});

export type ChatMessagesPage = z.infer<typeof ChatMessagesPageSchema>;

export const ChatUnreadCountSchema = z.object({
  count: z.number().int().nonnegative(),
});

export const ChatUnreadByOfferSchema = z.array(
  z.object({
    offerId: z.uuid(),
    unread: z.number().int().nonnegative(),
  }),
);

export type ChatUnreadByOffer = z.infer<typeof ChatUnreadByOfferSchema>;

// ── Лимиты (зеркалят серверные в chat.constants.ts) ──────────────────
export const CHAT_ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'];
export const CHAT_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const CHAT_MAX_DOC_BYTES = 16 * 1024 * 1024;
export const CHAT_MAX_ATTACHMENTS_PER_MESSAGE = 5;
export const CHAT_MAX_TEXT_LENGTH = 4000;
