import { Button, Loader, Group, Center } from '@mantine/core';
import { ArrowLeft, ArrowRightLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import {
  useLot,
  useLotImages,
  resolveLotActions,
  LotImagesCarousel,
  LotLocation,
  LotQuantity,
  LotStatusDates,
  LotDescription,
} from '@/entities/lot';
import { resolveBreadcrumbs, useTaxonomy } from '@/entities/taxonomy';
import { useAuthStore } from '@/entities/user';
import { openAuthRequiredModal } from '@/features/auth';
import { USER_ROLES } from '@/shared/constants/user-role';
import { ErrorStub } from '@/shared/ui';
import { getApiErrorStatusCode, useNavigation } from '@/shared/lib';
import { LotActions } from '@/widgets/LotActions';
import { ExchangeOfferModal } from '@/widgets/LotsFeed';

import styles from './LotPage.module.scss';

export const LotPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { back, toAuth } = useNavigation();
  const { currentUser, isAuthenticated } = useAuthStore();
  const { data: taxonomy = [] } = useTaxonomy();

  const { data: lot, isLoading, isError, error, refetch } = useLot(id);
  const { data: images = [] } = useLotImages(id);

  const [exchangeOpened, setExchangeOpened] = useState(false);

  const handleExchangeClick = () => {
    if (!isAuthenticated) {
      openAuthRequiredModal(toAuth, t);
      return;
    }
    setExchangeOpened(true);
  };

  const breadcrumbs = useMemo(() => {
    if (!lot) return [];
    return resolveBreadcrumbs(taxonomy, {
      chapterId: lot.chapterId,
      categoryId: lot.categoryId,
      subcategoryId: lot.subcategoryId,
    });
  }, [lot, taxonomy]);

  if (isLoading) {
    return (
      <Center py="xl" w="100%">
        <Loader />
      </Center>
    );
  }

  if (isError || !lot) {
    return (
      <ErrorStub
        status={getApiErrorStatusCode(error)}
        onRetry={() => refetch()}
        onBack={back}
      />
    );
  }

  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;
  const isOwner = currentUser?.id === lot.userId;
  const canExchange = !isOwner;
  const actions = resolveLotActions({
    lot,
    currentUserId: currentUser?.id ?? null,
    isAdmin,
  });

  return (
    <div className={styles.page}>
      {/* Хлебные крошки + кнопка назад */}
      <div className={styles.breadcrumbsRow}>
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          leftSection={<ArrowLeft size={14} />}
          onClick={back}
        >
          {t('common.back')}
        </Button>
        <Group gap={6} wrap="wrap">
          {breadcrumbs.map((part, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <Group key={part + i} gap={4} wrap="nowrap">
                <span
                  className={`${styles.breadcrumbItem} ${
                    isLast ? styles.breadcrumbActive : ''
                  }`}
                >
                  {part}
                </span>
                {!isLast && (
                  <ChevronRight
                    size={12}
                    color="var(--mantine-color-dimmed)"
                  />
                )}
              </Group>
            );
          })}
        </Group>
      </div>

      {/* Заголовок + статус */}
      <div>
        <h1 className={styles.title}>{lot.generalDescription}</h1>
        <div className={styles.statusRow} style={{ marginTop: 8 }}>
          <LotStatusDates
            visibilityStatus={lot.visibilityStatus}
            createdAt={lot.createdAt}
            archivationDate={lot.archivationDate ?? null}
            classes={{
              container: styles.statusRow,
              badge: styles.statusBadge,
              badgeActive: styles.statusBadgeActive,
              badgeArchived: styles.statusBadgeArchived,
              badgeHidden: styles.statusBadgeHidden,
            }}
          />
        </div>
      </div>

      {/* Двухколоночный layout */}
      <div className={styles.layout}>
        <div className={styles.main}>
          <LotImagesCarousel images={images} />

          <div className={styles.sectionCard}>
            <LotDescription
              description={lot.characteristicsDescription}
              classes={{
                section: undefined,
                sectionTitle: styles.sectionTitle,
                sectionTitleAccent: styles.sectionTitleAccent,
                text: styles.descriptionText,
              }}
            />
          </div>
        </div>

        <aside className={styles.sidebar}>
          {/* CTA на обмен — скрываем у владельца */}
          {canExchange && (
            <div className={styles.ctaCard}>
              <Button
                size="md"
                fullWidth
                leftSection={<ArrowRightLeft size={16} />}
                onClick={handleExchangeClick}
              >
                {t('feed.exchange.action')}
              </Button>
              <p className={styles.ctaHint} style={{ margin: 0 }}>
                {t('feed.exchange.confirm')}
              </p>
              <LotActions lot={lot} actions={actions} isAdmin={isAdmin} />
            </div>
          )}

          {/* Если владелец/админ — действия отдельной карточкой без CTA */}
          {!canExchange && (
            <div className={styles.sectionCard}>
              <LotActions lot={lot} actions={actions} isAdmin={isAdmin} />
            </div>
          )}

          {/* Локация */}
          <div className={styles.sectionCard}>
            <LotLocation
              region={lot.region}
              city={lot.city}
              district={lot.district}
              classes={{
                section: undefined,
                sectionTitle: styles.sectionTitle,
                sectionTitleAccent: styles.sectionTitleAccent,
                list: styles.locationList,
                row: styles.locationRow,
                icon: styles.locationIcon,
                label: styles.locationLabel,
                value: styles.locationValue,
                valueMuted: styles.locationValueMuted,
              }}
            />
          </div>

          {/* Количество */}
          {lot.quantity > 1 && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionTitleAccent} />
                <span>{t('lot.quantity')}</span>
              </div>
              <LotQuantity quantity={lot.quantity} className={styles.quantityChip} />
            </div>
          )}
        </aside>
      </div>

      <ExchangeOfferModal
        opened={exchangeOpened}
        targetLot={lot}
        onClose={() => setExchangeOpened(false)}
      />
    </div>
  );
};
