import {
  Badge,
  Breadcrumbs,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  useLot,
  useLotImages,
  getLotStatusMeta,
  resolveLotActions,
} from '@/entities/lot';
import { resolveBreadcrumbs, useTaxonomy } from '@/entities/taxonomy';
import { useAuthStore } from '@/entities/user';
import { USER_ROLES } from '@/shared/constants/user-role';
import { ErrorStub } from '@/shared/ui';
import { getApiErrorStatusCode, useNavigation, formatDate } from '@/shared/lib';

import { LotImagesCarousel } from './sections/LotImagesCarousel';
import { LotDescription } from './sections/LotDescription';
import { LotLocation } from './sections/LotLocation';
import { LotActions } from './sections/LotActions';
import { LotQuantity } from './sections/LotQuantity';

export const LotPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { back } = useNavigation();
  const { currentUser } = useAuthStore();
  const { data: taxonomy = [] } = useTaxonomy();

  const { data: lot, isLoading, isError, error } = useLot(id);
  const { data: images = [] } = useLotImages(id);

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
      <Group justify="center" style={{ width: '100%' }}>
        <Loader />
      </Group>
    );
  }

  if (isError || !lot) {
    return (
      <ErrorStub
        status={getApiErrorStatusCode(error)}
        onRetry={() => {}}
        onBack={back}
      />
    );
  }

  const statusMeta = getLotStatusMeta(lot.visibilityStatus);
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;
  const actions = resolveLotActions({
    lot,
    currentUserId: currentUser?.id ?? null,
    isAdmin,
  });

  return (
    <Stack gap="lg" maw={860} w="100%" mx="auto">
      <Breadcrumbs separator="→">
        {breadcrumbs.map((part) => (
          <Text key={part} c="dimmed" fw={500}>
            {part}
          </Text>
        ))}
      </Breadcrumbs>

      <Title order={1}>{lot.generalDescription}</Title>

      <Group>
        <Badge size="lg" color={statusMeta.color}>
          {t(statusMeta.labelKey)}
        </Badge>
        <Text c="dimmed">
          {t('lot.createdAt')}: {formatDate(lot.createdAt, i18n.language)}
        </Text>
      </Group>

      <LotImagesCarousel images={images} />
      <LotDescription description={lot.characteristicsDescription} />
      <LotLocation
        region={lot.region}
        city={lot.city}
        district={lot.district}
      />

      {lot.quantity !== 1 && <LotQuantity quantity={lot.quantity} />}

      <LotActions lot={lot} actions={actions} isAdmin={isAdmin} />
    </Stack>
  );
};
