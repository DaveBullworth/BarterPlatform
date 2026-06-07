import { useMemo, useState } from 'react';
import { SimpleGrid, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { SearchX, PackageOpen } from 'lucide-react';

import {
  useLots,
  useLotsMainImages,
  buildLotFilters,
  toLotImageSrc,
  type LotResponse,
} from '@/entities/lot';
import { useAuthStore } from '@/entities/user';
import { openAuthRequiredModal } from '@/features/auth';
import { useCategorySelection } from '@/features/category-filter';
import { useGeoFilter } from '@/features/geo-filter';
import { useSearchQuery } from '@/features/search-filter';
import { useNavigation } from '@/shared/lib/navigation';
import { ErrorStub, EmptyState } from '@/shared/ui';
import { getApiErrorStatusCode } from '@/shared/lib';
import { LotCardGrid } from './LotCardGrid';
import { LotCardList } from './LotCardList';
import { LotsFeedSkeleton } from './LotsFeedSkeleton';
import { ExchangeOfferModal } from './ExchangeOfferModal';

import { FeedControls, type FeedView, type LimitOption } from './FeedControls';

type Props = {
  selfOnly?: boolean;
};

export const LotsFeed = ({ selfOnly = false }: Props = {}) => {
  const { t, i18n } = useTranslation();
  const { toLotView, toAuth } = useNavigation();
  const { isAuthenticated, currentUser } = useAuthStore();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const isWide = useMediaQuery('(min-width: 90em)');

  const [view, setView] = useState<FeedView>('grid');
  const [page, setPage] = useState(1);
  const [limitValue, setLimitValue] = useState<LimitOption>('5');
  const [exchangeLot, setExchangeLot] = useState<LotResponse | null>(null);

  const handleExchange = (lot: LotResponse) => {
    if (!isAuthenticated) {
      openAuthRequiredModal(toAuth, t);
      return;
    }
    setExchangeLot(lot);
  };

  const limit = Number(limitValue);
  const { selection } = useCategorySelection();
  const { filter: geoFilter } = useGeoFilter();

  // Строим фильтры
  const { query: searchQuery } = useSearchQuery();

  const filters = useMemo(() => {
    const base = buildLotFilters(geoFilter, selection, searchQuery);
    return selfOnly ? { ...base, selfOnly: true } : base;
  }, [geoFilter, selection, searchQuery, selfOnly]);
  const filtersKey = JSON.stringify(filters);
  const hasFilters = filtersKey !== '{}';

  // Загрузка данных
  const {
    data: lotsData,
    isLoading,
    isError,
    error,
  } = useLots({
    page,
    limit,
    filters: hasFilters ? filtersKey : undefined,
  });

  const lots = lotsData?.data;
  const totalLots = lotsData?.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalLots / limit), 1);
  const gridCols = isMobile ? 2 : isWide ? 5 : 3;

  // lotIds стабильный — зависит от lotsData которое стабильно между ререндерами
  const lotIds = useMemo(() => (lots ?? []).map((l) => l.id), [lots]);
  const { data: mainImages = [] } = useLotsMainImages(lotIds);

  const imageMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const img of mainImages) {
      map[img.lotId] = toLotImageSrc(img);
    }
    return map;
  }, [mainImages]);

  // Сброс страницы при смене лимита
  const handleLimitChange = (value: string | null) => {
    setLimitValue((value as LimitOption) || '5');
    setPage(1);
  };

  if (isError) {
    return <ErrorStub status={getApiErrorStatusCode(error)} />;
  }

  const lotsToRender = lots ?? [];

  return (
    <>
      <Stack gap="sm" w="100%" mx="auto">
        {/* Controls */}
        <FeedControls
          view={view}
          onViewChange={setView}
          limitValue={limitValue}
          onLimitChange={handleLimitChange}
          page={page}
          onPageChange={setPage}
          totalPages={totalPages}
          lotsOnPage={lotsToRender.length}
          totalLots={totalLots}
        />

        {/* Content */}
        {isLoading && (
          <LotsFeedSkeleton view={view} count={limit} cols={gridCols} />
        )}

        {!isLoading && lotsToRender.length === 0 && (
          <EmptyState
            icon={hasFilters ? SearchX : PackageOpen}
            title={t('feed.noLotsFound')}
            description={
              hasFilters
                ? t('feed.noLotsFoundFiltered', {
                    defaultValue:
                      'Try adjusting filters or searching for something else.',
                  })
                : t('feed.noLotsFoundEmpty', {
                    defaultValue:
                      'There are no lots yet — be the first to add one.',
                  })
            }
          />
        )}

        {!isLoading && lotsToRender.length > 0 && view === 'grid' && (
          <SimpleGrid cols={gridCols} spacing="md" verticalSpacing="md">
            {lotsToRender.map((lot) => (
              <LotCardGrid
                key={lot.id}
                lot={lot}
                imageSrc={imageMap[lot.id] ?? null}
                locale={i18n.language}
                onOpen={toLotView}
                onExchange={handleExchange}
                hideExchange={selfOnly}
                exchangeDisabled={Boolean(
                  currentUser && lot.userId === currentUser.id,
                )}
              />
            ))}
          </SimpleGrid>
        )}

        {!isLoading && lotsToRender.length > 0 && view === 'list' && (
          <Stack gap="sm">
            {lotsToRender.map((lot) => (
              <LotCardList
                key={lot.id}
                lot={lot}
                imageSrc={imageMap[lot.id] ?? null}
                locale={i18n.language}
                onOpen={toLotView}
                onExchange={handleExchange}
                hideExchange={selfOnly}
                exchangeDisabled={Boolean(
                  currentUser && lot.userId === currentUser.id,
                )}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <ExchangeOfferModal
        opened={Boolean(exchangeLot)}
        targetLot={exchangeLot}
        onClose={() => setExchangeLot(null)}
      />
    </>
  );
};
