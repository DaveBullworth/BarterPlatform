import { Stepper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { OFFER_STATUS, type OfferDetail } from '@/entities/offer';

const fmt = (locale: string, date?: string | null): string | undefined =>
  date
    ? new Date(date).toLocaleString(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : undefined;

type Props = {
  offer: OfferDetail;
  locale: string;
};

/**
 * Путь изменения статусов предложения. Текущий шаг для PENDING/ACCEPTED
 * показывается со спиннером (loading), завершённые — своим цветом; отклонение
 * рисуется красной терминальной веткой.
 */
export const OfferStatusStepper = ({ offer, locale }: Props) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const orientation = isMobile ? 'vertical' : 'horizontal';

  if (offer.status === OFFER_STATUS.REJECTED) {
    const acceptedReached = Boolean(offer.acceptedAt);
    return (
      <Stepper
        active={acceptedReached ? 2 : 1}
        color="red"
        size="sm"
        orientation={orientation}
      >
        <Stepper.Step
          color="yellow"
          label={t('offers.status.pending')}
          description={fmt(locale, offer.createdAt)}
        />
        {acceptedReached && (
          <Stepper.Step
            color="blue"
            label={t('offers.status.accepted')}
            description={fmt(locale, offer.acceptedAt)}
          />
        )}
        <Stepper.Step
          color="red"
          label={t('offers.status.rejected')}
          description={fmt(locale, offer.rejectedAt)}
        />
      </Stepper>
    );
  }

  const active =
    offer.status === OFFER_STATUS.PENDING
      ? 0
      : offer.status === OFFER_STATUS.ACCEPTED
        ? 1
        : 3;

  return (
    <Stepper active={active} color="teal" size="sm" orientation={orientation}>
      <Stepper.Step
        color="yellow"
        label={t('offers.status.pending')}
        description={fmt(locale, offer.createdAt)}
        loading={offer.status === OFFER_STATUS.PENDING}
      />
      <Stepper.Step
        color="blue"
        label={t('offers.status.accepted')}
        description={fmt(locale, offer.acceptedAt)}
        loading={offer.status === OFFER_STATUS.ACCEPTED}
      />
      <Stepper.Step
        color="teal"
        label={t('offers.status.completed')}
        description={fmt(locale, offer.completedAt)}
      />
    </Stepper>
  );
};
