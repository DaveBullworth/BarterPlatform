/** Допустимые типы вложений чата — как на kufar: изображения и PDF. */
export const CHAT_ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png'] as const;
export const CHAT_ALLOWED_DOC_MIME = ['application/pdf'] as const;
export const CHAT_ALLOWED_MIME: string[] = [
  ...CHAT_ALLOWED_IMAGE_MIME,
  ...CHAT_ALLOWED_DOC_MIME,
];

/** Лимиты размеров (как у фото лотов — 8 МБ; PDF крупнее — 16 МБ). */
export const CHAT_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const CHAT_MAX_DOC_BYTES = 16 * 1024 * 1024;
/** Верхняя граница для multer-интерсептора (детальная проверка — в сервисе). */
export const CHAT_MAX_UPLOAD_BYTES = CHAT_MAX_DOC_BYTES;

export const CHAT_MAX_ATTACHMENTS_PER_MESSAGE = 5;
export const CHAT_MAX_TEXT_LENGTH = 4000;

export const CHAT_MESSAGES_PAGE_SIZE = 30;
export const CHAT_MESSAGES_MAX_PAGE_SIZE = 100;
