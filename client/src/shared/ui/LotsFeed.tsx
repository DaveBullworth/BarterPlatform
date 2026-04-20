import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Image,
  List,
  Loader,
  Pagination,
  Popover,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  BadgeInfo,
  CameraOff,
  LayoutGrid,
  LayoutList,
  ListOrdered,
} from 'lucide-react';

import { getCities, getDistricts, getRegions } from '@/http/geography';
import { getLots } from '@/http/lots';
import { getLotsMainImages, type LotMainImageDto } from '@/http/media';
import type { AppDispatch } from '@/store';
import { selectCategorySelection } from '@/store/categoryFilterSlice';
import { selectSearchQuery } from '@/store/searchFilterSlice';
import { fetchTaxonomyIfNeeded, selectTaxonomy } from '@/store/taxonomySlice';
import { buildFilters } from '@/shared/utils/buildFilters';
import { formatCreatedAt } from '@/shared/utils/formatCreatedAt';
import { goToLotView } from '@/shared/utils/navigation';
import { notify } from '@/shared/utils/notifications';
import { toImageSrc } from '@/shared/utils/toImageSrc';
import {
  GEO_FILTER_CHANGED_EVENT,
  readStoredGeoFilter,
  type GeoFilterStorageValue,
} from '@/shared/utils/geoFilter';
import { getApiErrorStatusCode } from '../utils/getApiErrorStatusCode';
import { handleApiError } from '../utils/handleApiError';
import { ErrorStub } from './ErrorStub';
import type { LotResponseDto } from '@/types/lot';

import styles from './LotsFeed.module.scss';
import ConfirmModal from './ConfirmModal';

type FeedView = 'grid' | 'list';
type LimitOption = '5' | '10' | '20';
type GeoLabels = {
  region: string;
  city: string;
  district: string;
};

const LIMIT_OPTIONS: LimitOption[] = ['5', '10', '20'];
const EMPTY_GEO_LABELS: GeoLabels = {
  region: '',
  city: '',
  district: '',
};

export const LotsFeed = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const isWide = useMediaQuery('(min-width: 90em)');

  const [limitValue, setLimitValue] = useState<LimitOption>('5');
  const [view, setView] = useState<FeedView>('grid');
  const [page, setPage] = useState(1);
  const [geoFilter, setGeoFilter] =
    useState<GeoFilterStorageValue>(readStoredGeoFilter);
  const [geoLabels, setGeoLabels] = useState<GeoLabels>(EMPTY_GEO_LABELS);
  const [lots, setLots] = useState<LotResponseDto[]>([]);
  const [totalLots, setTotalLots] = useState(0);
  const [imageMap, setImageMap] = useState<Record<string, LotMainImageDto>>({});
  const [exchangeLot, setExchangeLot] = useState<LotResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [isError, setIsError] = useState(false);

  const selectedCategory = useSelector(selectCategorySelection);
  const searchQuery = useSelector(selectSearchQuery);
  const taxonomy = useSelector(selectTaxonomy);

  const limit = Number(limitValue);

  const filters = useMemo(
    () => buildFilters(geoFilter, selectedCategory, searchQuery),
    [geoFilter, searchQuery, selectedCategory],
  );
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const hasFilters = filtersKey !== '{}';
  const totalPages = Math.max(Math.ceil(totalLots / limit), 1);

  const previousFiltersKeyRef = useRef(filtersKey);
  const previousLimitRef = useRef(limit);

  useEffect(() => {
    dispatch(fetchTaxonomyIfNeeded());
  }, [dispatch]);

  useEffect(() => {
    const syncGeoFilter = () => {
      setGeoFilter(readStoredGeoFilter());
    };

    window.addEventListener('storage', syncGeoFilter);
    window.addEventListener(GEO_FILTER_CHANGED_EVENT, syncGeoFilter);

    return () => {
      window.removeEventListener('storage', syncGeoFilter);
      window.removeEventListener(GEO_FILTER_CHANGED_EVENT, syncGeoFilter);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadGeoLabels = async () => {
      if (!geoFilter.regionId && !geoFilter.cityId && !geoFilter.districtId) {
        if (isMounted) {
          setGeoLabels(EMPTY_GEO_LABELS);
        }
        return;
      }

      try {
        const [regions, cities, districts] = await Promise.all([
          getRegions(),
          geoFilter.regionId && geoFilter.cityId
            ? getCities(Number(geoFilter.regionId))
            : Promise.resolve([]),
          geoFilter.cityId && geoFilter.districtId
            ? getDistricts(Number(geoFilter.cityId))
            : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        setGeoLabels({
          region:
            regions.find((item) => String(item.id) === geoFilter.regionId)
              ?.name ?? geoFilter.regionId,
          city:
            cities.find((item) => String(item.id) === geoFilter.cityId)?.name ??
            geoFilter.cityId,
          district:
            districts.find((item) => String(item.id) === geoFilter.districtId)
              ?.name ?? geoFilter.districtId,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setGeoLabels({
          region: geoFilter.regionId,
          city: geoFilter.cityId,
          district: geoFilter.districtId,
        });
      }
    };

    void loadGeoLabels();

    return () => {
      isMounted = false;
    };
  }, [geoFilter]);

  const fetchLots = useCallback(
    async (abortController: AbortController) => {
      setIsLoading(true);
      setIsError(false);
      setErrorStatus(null);

      try {
        const lotsResponse = await getLots(
          {
            page,
            limit,
            filters: hasFilters ? filtersKey : undefined,
          },
          abortController.signal,
        );

        if (abortController.signal.aborted) {
          return;
        }

        setLots(lotsResponse.data);
        setTotalLots(lotsResponse.total);

        if (!lotsResponse.data.length) {
          setImageMap({});
          return;
        }

        const lotIds = lotsResponse.data.map((lot) => lot.id);
        const images = await getLotsMainImages(lotIds);

        if (abortController.signal.aborted) {
          return;
        }

        const nextImageMap = images.items.reduce<
          Record<string, LotMainImageDto>
        >((acc, item) => {
          acc[item.lotId] = item;
          return acc;
        }, {});

        setImageMap(nextImageMap);
      } catch (requestError) {
        if (abortController.signal.aborted) {
          return;
        }

        const status = getApiErrorStatusCode(requestError);

        setLots([]);
        setTotalLots(0);
        setImageMap({});
        setErrorStatus(status);
        setIsError(true);
        handleApiError(requestError, t);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [filtersKey, hasFilters, limit, page, t],
  );

  useEffect(() => {
    const filtersChanged = previousFiltersKeyRef.current !== filtersKey;
    const limitChanged = previousLimitRef.current !== limit;

    if (page !== 1 && (filtersChanged || limitChanged)) {
      previousFiltersKeyRef.current = filtersKey;
      previousLimitRef.current = limit;
      setPage(1);
      return;
    }

    previousFiltersKeyRef.current = filtersKey;
    previousLimitRef.current = limit;

    const abortController = new AbortController();

    void fetchLots(abortController);

    return () => {
      abortController.abort();
    };
  }, [fetchLots, filtersKey, limit, page]);

  const geoSummary = useMemo(() => {
    const parts = [geoLabels.region, geoLabels.city, geoLabels.district].filter(
      Boolean,
    );

    return parts.length ? parts.join(' / ') : t('feed.filters.notSelected');
  }, [geoLabels, t]);

  const categorySummary = useMemo(() => {
    if (!selectedCategory) {
      return t('feed.filters.notSelected');
    }

    const chapter = taxonomy.find(
      (item) => item.id === selectedCategory.chapterId,
    );
    const category =
      selectedCategory.level !== 'chapter'
        ? chapter?.categories.find(
            (item) => item.id === selectedCategory.categoryId,
          )
        : null;
    const subcategory =
      selectedCategory.level === 'subcategory'
        ? category?.subcategories.find(
            (item) => item.id === selectedCategory.subcategoryId,
          )
        : null;

    const labelParts = [
      chapter?.name,
      category?.name,
      subcategory?.name,
    ].filter(Boolean);

    if (labelParts.length) {
      return labelParts.join(' / ');
    }

    const fallbackParts = [`#${selectedCategory.chapterId}`];

    if (selectedCategory.level !== 'chapter') {
      fallbackParts.push(`#${selectedCategory.categoryId}`);
    }

    if (selectedCategory.level === 'subcategory') {
      fallbackParts.push(`#${selectedCategory.subcategoryId}`);
    }

    return fallbackParts.join(' / ');
  }, [selectedCategory, t, taxonomy]);

  const searchSummary = searchQuery.trim() || t('feed.filters.notSelected');

  const openExchangeModal = (
    lot: LotResponseDto,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();
    setExchangeLot(lot);
  };

  const handleConfirmExchange = () => {
    if (!exchangeLot) {
      return;
    }

    notify({
      title: t('common.success'),
      message: t('feed.exchange.success', {
        title: exchangeLot.generalDescription,
      }),
      color: 'green',
    });

    setExchangeLot(null);
  };

  const openLot = (lotId: string) => {
    goToLotView(navigate, lotId);
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    lotId: string,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    openLot(lotId);
  };

  if (isLoading) {
    return (
      <Group justify="center" style={{ width: '100%', height: '100%' }}>
        <Loader />
      </Group>
    );
  }

  if (isError) {
    return (
      <ErrorStub
        status={errorStatus ?? undefined}
        t={t}
        onRetry={() => {
          setIsError(false);
          setErrorStatus(null);
          void fetchLots(new AbortController());
        }}
      />
    );
  }

  return (
    <>
      <Stack gap="md" w="100%" mx="auto">
        <Group justify="space-between" align="end" gap="sm">
          <Group className={styles.feedMeta} align="center">
            <Popover position="right" width={280} withArrow>
              <Popover.Target>
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  className={styles.pulseIcon}
                  aria-label={t('feed.info')}
                >
                  <BadgeInfo size={22} />
                </ActionIcon>
              </Popover.Target>

              <Popover.Dropdown p="0.5rem">
                <List spacing="xs" size="xs">
                  <List.Item>
                    <Text span fw={600}>
                      {t('feed.filters.geo')}:
                    </Text>{' '}
                    <Text span c="dimmed" className={styles.infoValue}>
                      {geoSummary}
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text span fw={600}>
                      {t('feed.filters.category')}:
                    </Text>{' '}
                    <Text span c="dimmed" className={styles.infoValue}>
                      {categorySummary}
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text span fw={600}>
                      {t('feed.filters.search')}:
                    </Text>{' '}
                    <Text span c="dimmed" className={styles.infoValue}>
                      {searchSummary}
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text span fw={600}>
                      {t('feed.recordsOnPage')}:
                    </Text>{' '}
                    <Text span c="dimmed">
                      {lots.length}
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text span fw={600}>
                      {t('feed.recordsTotal')}:
                    </Text>{' '}
                    <Text span c="dimmed">
                      {totalLots}
                    </Text>
                  </List.Item>
                </List>
              </Popover.Dropdown>
            </Popover>

            <Group gap="xs">
              <ListOrdered />
              <Select
                checkIconPosition="right"
                w={70}
                data={LIMIT_OPTIONS.map((value) => ({ value, label: value }))}
                value={limitValue}
                onChange={(value) => {
                  setLimitValue((value as LimitOption) || '5');
                  setPage(1);
                }}
                allowDeselect={false}
              />
            </Group>

            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size={isMobile ? 'sm' : 'md'}
            />
          </Group>

          <SegmentedControl
            value={view}
            onChange={(value) => setView(value as FeedView)}
            data={[
              {
                value: 'grid',
                label: isMobile ? (
                  <LayoutGrid />
                ) : (
                  <Group gap="xs" w="max-content">
                    <LayoutGrid /> {t('feed.view.grid')}
                  </Group>
                ),
              },
              {
                value: 'list',
                label: isMobile ? (
                  <LayoutList />
                ) : (
                  <Group gap="xs" w="max-content">
                    <LayoutList /> {t('feed.view.list')}
                  </Group>
                ),
              },
            ]}
          />
        </Group>

        {lots.length === 0 ? (
          <Text c="dimmed">{t('feed.noLotsFound')}</Text>
        ) : null}

        {lots.length > 0 ? (
          view === 'grid' ? (
            <SimpleGrid
              cols={isMobile ? 2 : isWide ? 5 : 3}
              spacing="md"
              verticalSpacing="md"
            >
              {lots.map((lot) => {
                const imageSrc = toImageSrc(imageMap[lot.id]);

                return (
                  <Card
                    key={lot.id}
                    withBorder
                    padding="sm"
                    className={styles.clickableCard}
                    role="link"
                    tabIndex={0}
                    onClick={() => openLot(lot.id)}
                    onKeyDown={(event) => handleCardKeyDown(event, lot.id)}
                  >
                    <Stack className={styles.gridCard}>
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={lot.generalDescription}
                          radius="sm"
                          style={{ aspectRatio: '1 / 1' }}
                          fit="cover"
                        />
                      ) : (
                        <Stack
                          gap="sm"
                          align="center"
                          className={styles.gridImageFallback}
                        >
                          <CameraOff size={42} />
                          <Text size="sm">{t('lot.noImages')}</Text>
                        </Stack>
                      )}

                      <Stack gap={4}>
                        <Text fw={700} lineClamp={2}>
                          {lot.generalDescription}
                        </Text>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {lot.characteristicsDescription}
                        </Text>
                        <Group justify="space-between" gap="xs">
                          <Text size="xs" c="dimmed">
                            {formatCreatedAt(lot.createdAt, i18n.language)}
                          </Text>
                          {lot.quantity !== 1 ? (
                            <Text fw={700} size="sm">
                              {lot.quantity}
                            </Text>
                          ) : null}
                        </Group>
                      </Stack>

                      <Button
                        mt="auto"
                        variant="light"
                        fullWidth
                        onClick={(event) => openExchangeModal(lot, event)}
                      >
                        {t('feed.exchange.action')}
                      </Button>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          ) : (
            <Stack gap="sm">
              {lots.map((lot) => {
                const imageSrc = toImageSrc(imageMap[lot.id]);

                return (
                  <Card
                    key={lot.id}
                    withBorder
                    padding="sm"
                    className={styles.clickableCard}
                    role="link"
                    tabIndex={0}
                    onClick={() => openLot(lot.id)}
                    onKeyDown={(event) => handleCardKeyDown(event, lot.id)}
                  >
                    <Group wrap="nowrap" align="stretch">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={lot.generalDescription}
                          w={80}
                          h={80}
                          radius="sm"
                          fit="cover"
                        />
                      ) : (
                        <Stack
                          gap="sm"
                          align="center"
                          className={styles.listImageFallback}
                        >
                          <CameraOff size={42} />
                          <Text size="sm">{t('lot.noImages')}</Text>
                        </Stack>
                      )}

                      <Stack gap={2} className={styles.listCardBody}>
                        <Text fw={700} size="lg" lineClamp={1}>
                          {lot.generalDescription}
                        </Text>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {lot.characteristicsDescription}
                        </Text>
                        <Group justify="space-between" mt="auto">
                          <Text size="xs" c="dimmed">
                            {formatCreatedAt(lot.createdAt, i18n.language)}
                          </Text>
                          {lot.quantity !== 1 ? (
                            <Text fw={700} size="sm">
                              {lot.quantity}
                            </Text>
                          ) : null}
                        </Group>
                      </Stack>

                      <Tooltip
                        label={t('feed.exchange.action')}
                        withArrow
                        position="top"
                      >
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="lg"
                          className={styles.listAction}
                          aria-label={t('feed.exchange.action')}
                          onClick={(event) => openExchangeModal(lot, event)}
                        >
                          <ArrowRightLeft size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          )
        ) : null}
      </Stack>

      <ConfirmModal
        opened={Boolean(exchangeLot)}
        onConfirm={handleConfirmExchange}
        onCancel={() => setExchangeLot(null)}
        title={t('feed.exchange.title')}
        message={t('feed.exchange.confirm')}
        confirmLabel={t('lotForm.actions.confirm')}
        cancelLabel={t('lotForm.actions.cancel')}
      />
    </>
  );
};
