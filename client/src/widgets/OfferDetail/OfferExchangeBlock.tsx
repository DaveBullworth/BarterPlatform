import { Box, Stack, Text, ThemeIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ArrowRightLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LotCardGrid, LotCardList } from '@/widgets/LotsFeed';
import { type LotResponse } from '@/entities/lot';

import styles from './OfferDetail.module.scss';

type Props = {
  targetLot: LotResponse | null;
  offeredLots: LotResponse[];
  imageMap: Record<string, string | null>;
  locale: string;
  onOpenLot: (id: string) => void;
};

const noop = () => {};

export const OfferExchangeBlock = ({
  targetLot,
  offeredLots,
  imageMap,
  locale,
  onOpenLot,
}: Props) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const single = offeredLots.length === 1;

  const className = isMobile
    ? `${styles.exchange} ${styles.exchangeColumn}`
    : styles.exchange;

  return (
    <div className={className}>
      <Box className={styles.side}>
        {targetLot ? (
          <LotCardGrid
            lot={targetLot}
            imageSrc={imageMap[targetLot.id] ?? null}
            locale={locale}
            onOpen={onOpenLot}
            onExchange={noop}
            hideExchange
          />
        ) : (
          <Text c="dimmed" size="sm">
            {t('offers.detail.lotUnavailable')}
          </Text>
        )}
      </Box>

      <div className={styles.exchangeIcon}>
        <ThemeIcon variant="light" color="barter" size={52} radius="xl">
          <ArrowRightLeft size={26} />
        </ThemeIcon>
      </div>

      <Box className={styles.side}>
        {offeredLots.length === 0 ? (
          <Text c="dimmed" size="sm">
            {t('offers.detail.lotUnavailable')}
          </Text>
        ) : single ? (
          <LotCardGrid
            lot={offeredLots[0]}
            imageSrc={imageMap[offeredLots[0].id] ?? null}
            locale={locale}
            onOpen={onOpenLot}
            onExchange={noop}
            hideExchange
          />
        ) : (
          <Stack gap="sm">
            {offeredLots.map((lot) => (
              <LotCardList
                key={lot.id}
                lot={lot}
                imageSrc={imageMap[lot.id] ?? null}
                locale={locale}
                onOpen={onOpenLot}
                onExchange={noop}
                hideExchange
              />
            ))}
          </Stack>
        )}
      </Box>
    </div>
  );
};
