import { useMemo } from 'react';
import { Stack, Center, Loader, Divider, Title } from '@mantine/core';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useOffer } from '@/entities/offer';
import { useLotsMainImages, toLotImageSrc } from '@/entities/lot';
import { useAuthStore } from '@/entities/user';
import { USER_ROLES } from '@/shared/constants/user-role';
import { useNavigation } from '@/shared/lib/navigation';
import { getApiErrorStatusCode } from '@/shared/lib';
import { ErrorStub } from '@/shared/ui';
import { OfferDetailHeader } from './OfferDetailHeader';
import { OfferExchangeBlock } from './OfferExchangeBlock';
import { OfferActions } from './OfferActions';

export const OfferDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuthStore();
  const { toLotView } = useNavigation();

  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;
  // «От лица пользователя» — только для админа (берём из query).
  const asUserId = isAdmin ? searchParams.get('asUser') ?? undefined : undefined;

  const { data: offer, isLoading, isError, error } = useOffer(id, asUserId);

  const lotIds = useMemo(() => {
    if (!offer) return [];
    const ids: string[] = [];
    if (offer.targetLot) ids.push(offer.targetLot.id);
    offer.offeredLots.forEach((lot) => ids.push(lot.id));
    return ids;
  }, [offer]);

  const { data: mainImages = [] } = useLotsMainImages(lotIds);
  const imageMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const img of mainImages) map[img.lotId] = toLotImageSrc(img);
    return map;
  }, [mainImages]);

  if (isError) {
    return <ErrorStub status={getApiErrorStatusCode(error)} />;
  }

  if (isLoading || !offer) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="lg" maw={900} w="100%" mx="auto">
      <OfferDetailHeader offer={offer} locale={i18n.language} />

      <Divider />

      <Title order={4}>{t('offers.detail.exchangeTitle')}</Title>
      <OfferExchangeBlock
        targetLot={offer.targetLot}
        offeredLots={offer.offeredLots}
        imageMap={imageMap}
        locale={i18n.language}
        onOpenLot={toLotView}
      />

      <Divider />

      <OfferActions offer={offer} asUserId={asUserId} />
    </Stack>
  );
};
