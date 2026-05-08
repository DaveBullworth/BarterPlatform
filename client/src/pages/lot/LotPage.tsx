import {
  Breadcrumbs,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
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
import { ConfirmModal, ErrorStub } from '@/shared/ui';
import { getApiErrorStatusCode, useNavigation } from '@/shared/lib';
import { notify } from '@/shared/lib/notify';
import { LotActions } from '@/widgets/LotActions';

export const LotPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { back, toAuth } = useNavigation();
  const { currentUser, isAuthenticated } = useAuthStore();
  const { data: taxonomy = [] } = useTaxonomy();

  const { data: lot, isLoading, isError, error } = useLot(id);
  const { data: images = [] } = useLotImages(id);

  const [exchangeOpened, setExchangeOpened] = useState(false);

  const handleExchangeClick = () => {
    if (!isAuthenticated) {
      openAuthRequiredModal(toAuth, t);
      return;
    }
    setExchangeOpened(true);
  };

  const handleConfirmExchange = () => {
    if (!lot) return;
    notify({
      title: t('common.success'),
      message: t('feed.exchange.success', {
        title: lot.generalDescription,
      }),
      color: 'green',
    });
    setExchangeOpened(false);
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

  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;
  const actions = resolveLotActions({
    lot,
    currentUserId: currentUser?.id ?? null,
    isAdmin,
  });

  return (
    <Stack gap="xs" maw={860} w="100%" mx="auto">
      <Breadcrumbs separator="→">
        {breadcrumbs.map((part) => (
          <Text key={part} c="dimmed" fw={500}>
            {part}
          </Text>
        ))}
      </Breadcrumbs>

      <Title order={1}>{lot.generalDescription}</Title>

      <LotStatusDates
        visibilityStatus={lot.visibilityStatus}
        createdAt={lot.createdAt}
        archivationDate={lot.archivationDate ?? null}
      />

      <Group justify="space-between">
        <Button
          variant="default"
          leftSection={<ArrowLeft size={16} />}
          onClick={back}
          style={{ alignItems: 'center' }}
        >
          {t('common.back')}
        </Button>
        <Group gap="xs">
          <Button variant="light" onClick={handleExchangeClick}>
            {t('feed.exchange.action')}
          </Button>
          <LotActions lot={lot} actions={actions} isAdmin={isAdmin} />
        </Group>
      </Group>

      <LotImagesCarousel images={images} />
      <LotDescription description={lot.characteristicsDescription} />
      <LotLocation
        region={lot.region}
        city={lot.city}
        district={lot.district}
      />

      {lot.quantity !== 1 && <LotQuantity quantity={lot.quantity} />}

      <ConfirmModal
        opened={exchangeOpened}
        onConfirm={handleConfirmExchange}
        onCancel={() => setExchangeOpened(false)}
        title={t('feed.exchange.title')}
        message={t('feed.exchange.confirm')}
        confirmLabel={t('lotForm.actions.confirm')}
        cancelLabel={t('lotForm.actions.cancel')}
        confirmColor="blue"
      />
    </Stack>
  );
};
