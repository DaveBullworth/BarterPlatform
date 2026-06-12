import { useMemo, useState } from 'react';
import {
  Stack,
  Group,
  Paper,
  SegmentedControl,
  MultiSelect,
  Pagination,
  Loader,
  Center,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { Inbox, CircleEllipsis } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  useOffersFeed,
  OFFER_ROLE,
  OFFER_STATUS,
  DEFAULT_OFFER_STATUS_FILTER,
  type OfferRole,
  type OfferStatus,
} from '@/entities/offer';
import { useLotsMainImages, toLotImageSrc } from '@/entities/lot';
import { useTaxonomy } from '@/entities/taxonomy';
import { useAuthStore } from '@/entities/user';
import { USER_ROLES } from '@/shared/constants/user-role';
import { chapterIcons } from '@/shared/constants/chapter-icon';
import { useNavigation } from '@/shared/lib/navigation';
import { getApiErrorStatusCode } from '@/shared/lib';
import { EmptyState, ErrorStub } from '@/shared/ui';
import { OfferCardList } from './OfferCardList';
import { AdminUserSelect } from './AdminUserSelect';

const LIMIT = 10;

export const OffersFeed = () => {
  const { t, i18n } = useTranslation();
  const { toOfferView } = useNavigation();
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;
  const isMobile = useMediaQuery('(max-width: 48em)');

  const [role, setRole] = useState<OfferRole>(OFFER_ROLE.INCOMING);
  const [statuses, setStatuses] = useState<OfferStatus[]>(
    DEFAULT_OFFER_STATUS_FILTER,
  );
  const [page, setPage] = useState(1);
  const [asUserId, setAsUserId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useOffersFeed({
    role,
    statuses,
    page,
    limit: LIMIT,
    asUserId: isAdmin && asUserId ? asUserId : undefined,
  });

  const offers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);

  // Страница могла опустеть (предложения сменили статус/исчезли из фильтра).
  if (data && page > totalPages) {
    setPage(totalPages);
  }

  // Главные фото целевых лотов — одним батч-запросом.
  const targetLotIds = useMemo(
    () =>
      offers
        .map((offer) => offer.targetLot?.id)
        .filter((id): id is string => Boolean(id)),
    [offers],
  );
  const { data: mainImages = [] } = useLotsMainImages(targetLotIds);
  const imageMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const img of mainImages) map[img.lotId] = toLotImageSrc(img);
    return map;
  }, [mainImages]);

  // Резолв иконки раздела: chapterId → slug → иконка.
  const { data: taxonomy = [] } = useTaxonomy();
  const chapterSlugById = useMemo(() => {
    const map = new Map<number, string>();
    taxonomy.forEach((chapter) => map.set(chapter.id, chapter.slug));
    return map;
  }, [taxonomy]);
  const getChapterIcon = (chapterId: number): LucideIcon => {
    const slug = chapterSlugById.get(chapterId);
    return (slug && chapterIcons[slug]) || CircleEllipsis;
  };

  const statusOptions = Object.values(OFFER_STATUS).map((status) => ({
    value: status,
    label: t(`offers.status.${status}`),
  }));

  const resetPage = () => setPage(1);

  if (isError) {
    return <ErrorStub status={getApiErrorStatusCode(error)} />;
  }

  return (
    <Stack gap="sm" maw={760} w="100%" mx="auto">
      <Paper
        p="xs"
        radius="lg"
        withBorder
        shadow="xs"
        bg="var(--mantine-color-body)"
      >
        <Stack gap="sm">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <SegmentedControl
              size="sm"
              fullWidth={isMobile}
              w={isMobile ? '100%' : undefined}
              value={role}
              onChange={(value) => {
                setRole(value as OfferRole);
                resetPage();
              }}
              data={[
                { value: OFFER_ROLE.INCOMING, label: t('offers.role.incoming') },
                { value: OFFER_ROLE.OUTGOING, label: t('offers.role.outgoing') },
              ]}
            />

            {isAdmin && (
              <AdminUserSelect
                value={asUserId}
                onChange={(value) => {
                  setAsUserId(value);
                  resetPage();
                }}
              />
            )}
          </Group>

          <MultiSelect
            size="sm"
            data={statusOptions}
            value={statuses}
            onChange={(value) => {
              setStatuses(value as OfferStatus[]);
              resetPage();
            }}
            placeholder={
              statuses.length === 0 ? t('offers.filterStatuses') : undefined
            }
            clearable
            comboboxProps={{ withinPortal: true }}
          />
        </Stack>
      </Paper>

      {isLoading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {!isLoading && offers.length === 0 && (
        <EmptyState
          icon={Inbox}
          title={t('offers.empty.title')}
          description={t('offers.empty.description')}
        />
      )}

      {!isLoading && offers.length > 0 && (
        <>
          <Stack gap="sm">
            {offers.map((offer) => (
              <OfferCardList
                key={offer.id}
                offer={offer}
                imageSrc={imageMap[offer.targetLot?.id ?? ''] ?? null}
                locale={i18n.language}
                getChapterIcon={getChapterIcon}
                onOpen={(id) =>
                  toOfferView(id, isAdmin && asUserId ? asUserId : undefined)
                }
              />
            ))}
          </Stack>

          {totalPages > 1 && (
            <Group justify="center" mt="xs">
              <Pagination
                value={page}
                onChange={setPage}
                total={totalPages}
                size="sm"
              />
            </Group>
          )}
        </>
      )}
    </Stack>
  );
};
