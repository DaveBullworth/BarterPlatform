import { Box, Group, Stack, Text } from '@mantine/core';
import { Check, CheckCheck } from 'lucide-react';

import { type ChatMessage } from '@/entities/chat';
import { ChatAttachmentView } from './ChatAttachmentView';

type Props = {
  offerId: string;
  message: ChatMessage;
  locale: string;
  enabled: boolean;
};

const formatTime = (iso: string, locale: string): string =>
  new Date(iso).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

/** Один баббл сообщения: свои — справа (акцент), чужие — слева. */
export const ChatMessageItem = ({
  offerId,
  message,
  locale,
  enabled,
}: Props) => {
  const mine = message.isMine;

  return (
    <Group justify={mine ? 'flex-end' : 'flex-start'} gap={0} w="100%">
      <Stack
        gap={6}
        p="xs"
        maw="80%"
        style={{
          borderRadius: 12,
          background: mine
            ? 'var(--mantine-color-barter-light)'
            : 'var(--mantine-color-default-hover)',
        }}
      >
        {message.attachments.length > 0 && (
          <Stack gap={6}>
            {message.attachments.map((attachment) => (
              <ChatAttachmentView
                key={attachment.id}
                offerId={offerId}
                attachment={attachment}
                enabled={enabled}
              />
            ))}
          </Stack>
        )}

        {message.text && (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.text}
          </Text>
        )}

        <Group gap={4} justify="flex-end" align="center" wrap="nowrap">
          <Text size="10px" c="dimmed">
            {formatTime(message.createdAt, locale)}
          </Text>
          {mine && (
            <Box c={message.readAt ? 'barter' : 'dimmed'} display="flex">
              {message.readAt ? (
                <CheckCheck size={14} />
              ) : (
                <Check size={14} />
              )}
            </Box>
          )}
        </Group>
      </Stack>
    </Group>
  );
};
