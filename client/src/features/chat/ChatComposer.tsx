import { useState } from 'react';
import {
  ActionIcon,
  Box,
  FileButton,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@mantine/core';
import { Paperclip, Send, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useSendChatMessage,
  useUploadChatAttachment,
  CHAT_ALLOWED_MIME,
  CHAT_MAX_ATTACHMENTS_PER_MESSAGE,
  CHAT_MAX_DOC_BYTES,
  CHAT_MAX_IMAGE_BYTES,
  CHAT_MAX_TEXT_LENGTH,
} from '@/entities/chat';
import { handleApiError, notify } from '@/shared/lib';
import { uid } from '@/shared/lib/uid';

const EXT_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
};

/**
 * iOS Safari может отдать файл с пустым `type` — восстанавливаем MIME по
 * расширению и перезаворачиваем File, чтобы multipart ушёл с правильным
 * Content-Type (иначе сервер отклонит как octet-stream). null = тип не наш.
 */
const normalizeFile = (file: File): File | null => {
  if (CHAT_ALLOWED_MIME.includes(file.type)) return file;
  if (file.type !== '') return null;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = EXT_MIME[ext];
  return mime ? new File([file], file.name, { type: mime }) : null;
};

type PendingAttachment = {
  localId: string;
  file: File;
  status: 'uploading' | 'done' | 'error';
  attachmentId?: string;
  /** Локальный object URL для превью изображений (до отправки). */
  previewUrl?: string;
};

type Props = {
  offerId: string;
};

/**
 * Поле ввода сообщения: текст + вложения (PNG/JPG/PDF). Файлы загружаются сразу
 * при выборе (ранний фидбэк по типу/размеру/антивирусу), а сообщение отправляется
 * уже со ссылками на загруженные вложения.
 */
export const ChatComposer = ({ offerId }: Props) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);

  const upload = useUploadChatAttachment(offerId);
  const send = useSendChatMessage(offerId);

  const isImage = (mime: string) => mime.startsWith('image/');

  const validateSize = (file: File): string | null => {
    const max = isImage(file.type) ? CHAT_MAX_IMAGE_BYTES : CHAT_MAX_DOC_BYTES;
    if (file.size > max) {
      return t('chat.errors.tooLarge', {
        size: Math.round(max / (1024 * 1024)),
      });
    }
    return null;
  };

  const handlePick = (picked: File[]) => {
    if (!picked.length) return;

    const room = CHAT_MAX_ATTACHMENTS_PER_MESSAGE - attachments.length;
    if (room <= 0) {
      notify({ message: t('chat.errors.tooMany'), color: 'yellow' });
      return;
    }

    for (const raw of picked.slice(0, room)) {
      const file = normalizeFile(raw);
      if (!file) {
        notify({ message: t('chat.errors.wrongType'), color: 'red' });
        continue;
      }

      const sizeError = validateSize(file);
      if (sizeError) {
        notify({ message: sizeError, color: 'red' });
        continue;
      }

      const localId = uid();
      const previewUrl = isImage(file.type)
        ? URL.createObjectURL(file)
        : undefined;

      setAttachments((prev) => [
        ...prev,
        { localId, file, status: 'uploading', previewUrl },
      ]);

      upload.mutate(file, {
        onSuccess: (attachment) => {
          setAttachments((prev) =>
            prev.map((item) =>
              item.localId === localId
                ? { ...item, status: 'done', attachmentId: attachment.id }
                : item,
            ),
          );
        },
        onError: (err) => {
          setAttachments((prev) =>
            prev.filter((item) => item.localId !== localId),
          );
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          handleApiError(err, t);
        },
      });
    }
  };

  const removeAttachment = (localId: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.localId === localId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.localId !== localId);
    });
  };

  const uploading = attachments.some((a) => a.status === 'uploading');
  const ready = attachments
    .filter((a) => a.status === 'done' && a.attachmentId)
    .map((a) => a.attachmentId!);
  const trimmed = text.trim();
  const canSend = !uploading && !send.isPending && (trimmed || ready.length > 0);

  const handleSend = () => {
    if (!canSend) return;
    send.mutate(
      {
        text: trimmed || undefined,
        attachmentIds: ready.length ? ready : undefined,
      },
      {
        onSuccess: () => {
          attachments.forEach((a) => {
            if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
          });
          setText('');
          setAttachments([]);
        },
        onError: (err) => handleApiError(err, t),
      },
    );
  };

  return (
    <Stack gap="xs">
      {attachments.length > 0 && (
        <Group gap="xs" wrap="wrap">
          {attachments.map((item) => (
            <Paper
              key={item.localId}
              withBorder
              radius="md"
              p={4}
              pos="relative"
              w={64}
              h={64}
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 6,
                    opacity: item.status === 'uploading' ? 0.5 : 1,
                  }}
                />
              ) : (
                <Stack align="center" justify="center" gap={2} h="100%">
                  <FileText size={20} />
                  <Text size="9px" lineClamp={1} maw={56}>
                    {item.file.name}
                  </Text>
                </Stack>
              )}

              {item.status === 'uploading' && (
                <Box pos="absolute" top={4} left={4}>
                  <Loader size={14} />
                </Box>
              )}

              <ActionIcon
                size="xs"
                color="red"
                variant="filled"
                radius="xl"
                pos="absolute"
                top={-6}
                right={-6}
                onClick={() => removeAttachment(item.localId)}
                aria-label={t('chat.removeAttachment')}
              >
                <X size={12} />
              </ActionIcon>
            </Paper>
          ))}
        </Group>
      )}

      <Group gap="xs" align="flex-end" wrap="nowrap">
        <FileButton
          onChange={handlePick}
          accept={CHAT_ALLOWED_MIME.join(',')}
          multiple
        >
          {(props) => (
            <Tooltip label={t('chat.attach')} withArrow>
              <ActionIcon
                {...props}
                variant="subtle"
                size="lg"
                disabled={attachments.length >= CHAT_MAX_ATTACHMENTS_PER_MESSAGE}
                aria-label={t('chat.attach')}
              >
                <Paperclip size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </FileButton>

        <Textarea
          flex={1}
          autosize
          minRows={1}
          maxRows={5}
          maxLength={CHAT_MAX_TEXT_LENGTH}
          placeholder={t('chat.inputPlaceholder')}
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <ActionIcon
          size="lg"
          color="barter"
          disabled={!canSend}
          loading={send.isPending}
          onClick={handleSend}
          aria-label={t('chat.send')}
        >
          <Send size={18} />
        </ActionIcon>
      </Group>
    </Stack>
  );
};
