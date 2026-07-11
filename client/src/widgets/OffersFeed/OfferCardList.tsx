import {
  Card,
  Group,
  Stack,
  Text,
  Avatar,
  Badge,
  ThemeIcon,
  ActionIcon,
  Indicator,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ImageOff, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

import { type OfferFeedItem } from '@/entities/offer';
import { getUserAvatarUrl } from '@/entities/user';
import { formatDate } from '@/shared/lib/formatters';
import { preload } from '@/shared/lib/preload';
import { OfferStatusBadge } from './OfferStatusBadge';

import styles from './OffersFeed.module.scss';

type Props = {
  offer: OfferFeedItem;
  imageSrc: string | null;
  locale: string;
  unread: number;
  getChapterIcon: (chapterId: number) => LucideIcon;
  onOpen: (id: string) => void;
  onOpenChat: (id: string) => void;
};

export const OfferCardList = ({
  offer,
  imageSrc,
  locale,
  unread,
  getChapterIcon,
  onOpen,
  onOpenChat,
}: Props) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 48em)');

  // Уникальные разделы предлагаемых лотов — иконка раздела берётся один раз.
  const uniqueChapterIds = [
    ...new Set(offer.offeredLots.map((lot) => lot.chapterId)),
  ];
  const firstOffered = offer.offeredLots[0];
  const extraCount = Math.max(offer.offeredLots.length - 1, 0);

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(offer.id);
    }
  };

  return (
    <Card
      className={styles.offerCard}
      p="sm"
      radius="md"
      role="link"
      tabIndex={0}
      onClick={() => onOpen(offer.id)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => preload('offer')}
      onTouchStart={() => preload('offer')}
    >
      <Group wrap="nowrap" align="center" gap={isMobile ? 'xs' : 'md'}>
        {/* Аватар другого участника */}
        <Avatar
          src={getUserAvatarUrl(offer.counterpartId)}
          radius="xl"
          size={isMobile ? 40 : 48}
        />

        {/* Главное фото целевого лота */}
        {imageSrc ? (
          <div className={styles.offerImage}>
            <img
              src={imageSrc}
              alt={offer.targetLot?.generalDescription ?? ''}
              loading="lazy"
            />
          </div>
        ) : (
          <div className={styles.offerImageFallback}>
            <ImageOff size={26} strokeWidth={1.5} />
          </div>
        )}

        {/* Три строки информации */}
        <Stack className={styles.offerBody} gap={6}>
          <OfferStatusBadge status={offer.status} />

          <Text size="xs" c="dimmed">
            {formatDate(offer.createdAt, locale)}
          </Text>

          {offer.offeredLots.length === 0 ? (
            <Text size="sm" c="dimmed">
              —
            </Text>
          ) : isMobile ? (
            <Group gap={6} wrap="wrap">
              {uniqueChapterIds.map((chapterId) => {
                const Icon = getChapterIcon(chapterId);
                return (
                  <ThemeIcon
                    key={chapterId}
                    variant="light"
                    color="barter"
                    size={28}
                    radius="md"
                  >
                    <Icon size={16} strokeWidth={2} />
                  </ThemeIcon>
                );
              })}
            </Group>
          ) : (
            <Group gap="xs" wrap="nowrap">
              <Text
                size="sm"
                fw={500}
                lineClamp={1}
                className={styles.offeredDesc}
              >
                {firstOffered.generalDescription}
              </Text>
              {extraCount > 0 && (
                <Badge size="sm" variant="light" color="gray" circle>
                  +{extraCount}
                </Badge>
              )}
            </Group>
          )}
        </Stack>

        {/* Чат с контрагентом — открывает страницу предложения с диалогом */}
        <Tooltip label={t('offers.chat.button')} withArrow position="top">
          <Indicator
            color="red"
            size={16}
            label={unread > 0 ? unread : undefined}
            disabled={unread === 0}
            offset={4}
          >
            <ActionIcon
              variant="light"
              color="barter"
              size="lg"
              className={styles.offerAction}
              aria-label={t('offers.chat.button')}
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat(offer.id);
              }}
            >
              <MessageCircle size={18} />
            </ActionIcon>
          </Indicator>
        </Tooltip>
      </Group>
    </Card>
  );
};
