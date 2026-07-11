import { useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Center,
  Divider,
  Drawer,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import {
  useChatMessages,
  useMarkChatRead,
  type ChatMessage,
} from '@/entities/chat';
import { ChatComposer } from '@/features/chat';
import { ChatMessageItem } from './ChatMessageItem';

type Props = {
  offerId: string;
  counterpartName: string;
  opened: boolean;
  onClose: () => void;
};

const dayKey = (iso: string): string => new Date(iso).toDateString();

const formatDay = (iso: string, locale: string): string =>
  new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const ChatPanel = ({
  offerId,
  counterpartName,
  opened,
  onClose,
}: Props) => {
  const { t, i18n } = useTranslation();
  const { messages, hasMore, isLoading, loadOlder } = useChatMessages(
    offerId,
    opened,
  );
  const markRead = useMarkChatRead(offerId);

  const viewportRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef<string | null>(null);

  const newestId = messages.length ? messages[messages.length - 1].id : null;

  // Прокрутка вниз при появлении новых сообщений / открытии.
  useEffect(() => {
    if (!opened) return;
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight });
  }, [opened, newestId]);

  // Отметка прочитанным: один раз на каждое новое последнее сообщение, если есть
  // непрочитанные входящие (markedRef не даёт зациклиться на том же сообщении).
  useEffect(() => {
    if (!opened || !newestId || markedRef.current === newestId) return;
    const hasUnreadIncoming = messages.some((m) => !m.isMine && !m.readAt);
    if (hasUnreadIncoming) {
      markRead.mutate();
      markedRef.current = newestId;
    }
  }, [opened, newestId, messages, markRead]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="lg"
      title={
        <Text fw={700} lineClamp={1}>
          {counterpartName || t('chat.title')}
        </Text>
      }
      styles={{
        body: {
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100% - 60px)',
          overflow: 'hidden',
          paddingBottom: 'var(--mantine-spacing-md)',
        },
      }}
    >
      <ScrollArea flex={1} viewportRef={viewportRef} offsetScrollbars>
        {isLoading ? (
          <Center py="xl">
            <Loader color="barter" />
          </Center>
        ) : messages.length === 0 ? (
          <Center py="xl">
            <Text size="sm" c="dimmed">
              {t('chat.empty')}
            </Text>
          </Center>
        ) : (
          <Stack gap="xs" pr="xs">
            {hasMore && (
              <Group justify="center">
                <Button variant="subtle" size="xs" onClick={loadOlder}>
                  {t('chat.loadOlder')}
                </Button>
              </Group>
            )}

            {messages.map((message: ChatMessage, index) => {
              const prev = messages[index - 1];
              const showDay =
                !prev || dayKey(prev.createdAt) !== dayKey(message.createdAt);
              return (
                <Box key={message.id}>
                  {showDay && (
                    <Divider
                      my="xs"
                      label={formatDay(message.createdAt, i18n.language)}
                      labelPosition="center"
                    />
                  )}
                  <ChatMessageItem
                    offerId={offerId}
                    message={message}
                    locale={i18n.language}
                    enabled={opened}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </ScrollArea>

      <Box pt="sm">
        <ChatComposer offerId={offerId} />
      </Box>
    </Drawer>
  );
};
