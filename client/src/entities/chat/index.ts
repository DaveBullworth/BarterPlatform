export {
  chatKeys,
  chatApi,
  useChatMessages,
  useSendChatMessage,
  useUploadChatAttachment,
  useMarkChatRead,
  useChatUnreadCount,
  useChatUnreadByOffer,
  useChatAttachmentUrl,
} from './api';

export {
  CHAT_ATTACHMENT_KIND,
  CHAT_ALLOWED_MIME,
  CHAT_MAX_IMAGE_BYTES,
  CHAT_MAX_DOC_BYTES,
  CHAT_MAX_ATTACHMENTS_PER_MESSAGE,
  CHAT_MAX_TEXT_LENGTH,
  type ChatMessage,
  type ChatAttachment,
  type ChatAttachmentKind,
  type ChatMessagesPage,
  type ChatUnreadByOffer,
} from './model';
