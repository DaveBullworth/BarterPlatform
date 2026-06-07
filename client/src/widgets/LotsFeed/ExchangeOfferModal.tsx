import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Pagination,
  Stack,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { Info, PackageOpen, SearchX } from 'lucide-react';

import {
  useLots,
  useLotsMainImages,
  toLotImageSrc,
  type LotResponse,
} from '@/entities/lot';
import {
  useLotOwnerAvailability,
  useCreateOffer,
  isLotOfferable,
  MAX_OFFERED_LOTS,
} from '@/entities/offer';
import { notify, handleApiError } from '@/shared/lib';
import { EmptyState } from '@/shared/ui';
import { LotCardList } from './LotCardList';

type Props = {
  targetLot: LotResponse | null;
  opened: boolean;
  onClose: () => void;
};

const LIMIT = 6;

export const ExchangeOfferModal = ({ targetLot, opened, onClose }: Props) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 48em)');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen={isMobile}
      size="lg"
      centered
      title={
        <Text fw={700} size="lg">
          {t('feed.exchange.modalTitle')}
        </Text>
      }
    >
      {opened && targetLot ? (
        <ExchangeOfferContent targetLot={targetLot} onClose={onClose} />
      ) : null}
    </Modal>
  );
};

type ContentProps = {
  targetLot: LotResponse;
  onClose: () => void;
};

const ExchangeOfferContent = ({ targetLot, onClose }: ContentProps) => {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 48em)');

  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: availability, isLoading: availabilityLoading } =
    useLotOwnerAvailability(targetLot.id);

  const filtersKey = useMemo(
    () => JSON.stringify({ selfOnly: true, excludeArchived: true }),
    [],
  );
  const { data: lotsData, isLoading: lotsLoading } = useLots({
    page,
    limit: LIMIT,
    filters: filtersKey,
  });

  const lots = useMemo(() => lotsData?.data ?? [], [lotsData]);
  const total = lotsData?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);

  const lotIds = useMemo(() => lots.map((l) => l.id), [lots]);
  const { data: mainImages = [] } = useLotsMainImages(lotIds);
  const imageMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const img of mainImages) map[img.lotId] = toLotImageSrc(img);
    return map;
  }, [mainImages]);

  const createOffer = useCreateOffer();

  const hasNoPreferences =
    Boolean(availability) &&
    availability!.chapterIds.length === 0 &&
    availability!.categoryIds.length === 0 &&
    availability!.subcategoryIds.length === 0;

  const toggle = (lot: LotResponse) => {
    setSelectedIds((prev) => {
      if (prev.includes(lot.id)) return prev.filter((id) => id !== lot.id);
      if (prev.length >= MAX_OFFERED_LOTS) {
        notify({ message: t('feed.exchange.maxReached'), color: 'yellow' });
        return prev;
      }
      return [...prev, lot.id];
    });
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) return;
    createOffer.mutate(
      { lotId: targetLot.id, offeredLotIds: selectedIds },
      {
        onSuccess: () => {
          notify({
            title: t('common.success'),
            message: t('feed.exchange.offerSent'),
            color: 'green',
          });
          onClose();
        },
        onError: (error) => handleApiError(error, t),
      },
    );
  };

  const isBusy = availabilityLoading || lotsLoading;

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {t('feed.exchange.modalSubtitle', { max: MAX_OFFERED_LOTS })}
      </Text>

      {hasNoPreferences && (
        <Alert icon={<Info size={16} />} color="yellow" variant="light">
          {t('feed.exchange.noPrefs')}
        </Alert>
      )}

      {totalPages > 1 && (
        <Group justify="flex-end">
          <Pagination
            value={page}
            onChange={setPage}
            total={totalPages}
            size="sm"
            siblings={isMobile ? 0 : 1}
          />
        </Group>
      )}

      {isBusy && (
        <Center py="xl">
          <Loader color="barter" />
        </Center>
      )}

      {!isBusy && lots.length === 0 && (
        <EmptyState
          icon={total === 0 ? PackageOpen : SearchX}
          title={t('feed.exchange.empty')}
        />
      )}

      {!isBusy && lots.length > 0 && (
        <Stack gap="sm">
          {lots.map((lot) => (
            <LotCardList
              key={lot.id}
              lot={lot}
              imageSrc={imageMap[lot.id] ?? null}
              locale={i18n.language}
              onOpen={() => {}}
              onExchange={() => {}}
              selectable
              selected={selectedIds.includes(lot.id)}
              selectionDisabled={!isLotOfferable(lot, availability)}
              onSelectToggle={toggle}
            />
          ))}
        </Stack>
      )}

      <Box
        pos="sticky"
        bottom={0}
        py="sm"
        style={{
          background: 'var(--mantine-color-body)',
          borderTop: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text size="sm" fw={600}>
            {t('feed.exchange.selectedCount', {
              count: selectedIds.length,
              max: MAX_OFFERED_LOTS,
            })}
          </Text>
          <Group gap="xs" wrap="nowrap">
            <Button variant="default" onClick={onClose}>
              {t('lotForm.actions.cancel')}
            </Button>
            <Button
              color="barter"
              disabled={selectedIds.length === 0}
              loading={createOffer.isPending}
              onClick={handleSubmit}
            >
              {t('feed.exchange.submit')}
            </Button>
          </Group>
        </Group>
      </Box>
    </Stack>
  );
};
