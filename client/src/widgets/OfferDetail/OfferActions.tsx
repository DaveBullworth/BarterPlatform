import { useState } from 'react';
import { Button, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import { Check, X, MessageCircle, Flag, Handshake } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useAcceptOffer,
  useRejectOffer,
  useConfirmOffer,
  useReportOffer,
  OFFER_STATUS,
  type OfferDetail,
} from '@/entities/offer';
import { ConfirmModal } from '@/shared/ui';
import { handleApiError, notify } from '@/shared/lib';

import styles from './OfferActions.module.scss';

type Props = {
  offer: OfferDetail;
  asUserId?: string;
};

type PendingAction = 'accept' | 'confirm' | 'reject' | 'report';

/**
 * Панель действий предложения: слева — решения по сделке (смена статуса),
 * справа — общение и жалобы. Каждое действие проходит через ConfirmModal.
 */
export const OfferActions = ({ offer, asUserId }: Props) => {
  const { t } = useTranslation();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const accept = useAcceptOffer(offer.id, asUserId);
  const reject = useRejectOffer(offer.id, asUserId);
  const confirm = useConfirmOffer(offer.id, asUserId);
  const report = useReportOffer(offer.id, asUserId);

  const confirmMeta: Record<
    PendingAction,
    {
      title: string;
      message: string;
      confirmLabel: string;
      confirmColor: string;
      loading: boolean;
    }
  > = {
    accept: {
      title: t('offers.actions.acceptTitle'),
      message: t('offers.actions.acceptText'),
      confirmLabel: t('offers.actions.accept'),
      confirmColor: 'green',
      loading: accept.isPending,
    },
    confirm: {
      title: t('offers.actions.confirmTitle'),
      message: t('offers.actions.confirmText'),
      confirmLabel: t('offers.actions.confirm'),
      confirmColor: 'teal',
      loading: confirm.isPending,
    },
    reject: {
      title: t('offers.actions.rejectTitle'),
      message: t('offers.actions.rejectText'),
      confirmLabel: t('offers.actions.reject'),
      confirmColor: 'red',
      loading: reject.isPending,
    },
    report: {
      title: t('offers.report.title'),
      message: t('offers.report.text'),
      confirmLabel: t('offers.report.confirm'),
      confirmColor: 'red',
      loading: report.isPending,
    },
  };

  const runPendingAction = () => {
    if (!pendingAction) return;

    const onError = (error: unknown) => {
      setPendingAction(null);
      handleApiError(error, t);
    };
    const done = (message: string, color: string) => {
      setPendingAction(null);
      notify({ message, color });
    };

    switch (pendingAction) {
      case 'accept':
        accept.mutate(undefined, {
          onSuccess: () => done(t('offers.actions.accepted'), 'green'),
          onError,
        });
        break;
      case 'confirm':
        confirm.mutate(undefined, {
          onSuccess: () => done(t('offers.actions.confirmed'), 'green'),
          onError,
        });
        break;
      case 'reject':
        reject.mutate(undefined, {
          onSuccess: () => done(t('offers.actions.rejected'), 'yellow'),
          onError,
        });
        break;
      case 'report':
        report.mutate(undefined, {
          onSuccess: () => done(t('offers.report.sent'), 'green'),
          onError,
        });
        break;
    }
  };

  const onChat = () =>
    notify({ message: t('offers.chat.soon'), color: 'blue' });

  const { canAccept, canConfirm, canReject } = offer.actions;
  const hasDealActions = canAccept || canConfirm || canReject;

  // Подсказка вместо кнопок, когда сделка в терминальном статусе.
  const finishedHint =
    offer.status === OFFER_STATUS.COMPLETED
      ? t('offers.actions.completedHint')
      : t('offers.actions.rejectedHint');

  // Ждём подтверждения второй стороны (своё уже отдали).
  const waitingOther =
    offer.status === OFFER_STATUS.ACCEPTED && offer.viewerConfirmed;

  const meta = pendingAction ? confirmMeta[pendingAction] : null;

  return (
    <>
      <Paper
        p="md"
        radius="lg"
        withBorder
        shadow="xs"
        bg="var(--mantine-color-body)"
      >
        <div className={styles.bar}>
          <Stack gap={8} className={styles.dealZone}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {t('offers.actions.dealZone')}
            </Text>

            {hasDealActions ? (
              <Group gap="sm" wrap="wrap">
                {canAccept && (
                  <Button
                    color="green"
                    leftSection={<Check size={16} />}
                    className={styles.dealButton}
                    onClick={() => setPendingAction('accept')}
                  >
                    {t('offers.actions.accept')}
                  </Button>
                )}

                {canConfirm && (
                  <Button
                    color="teal"
                    leftSection={<Handshake size={16} />}
                    className={styles.dealButton}
                    onClick={() => setPendingAction('confirm')}
                  >
                    {t('offers.actions.confirm')}
                  </Button>
                )}

                {canReject && (
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<X size={16} />}
                    className={styles.dealButton}
                    onClick={() => setPendingAction('reject')}
                  >
                    {t('offers.actions.reject')}
                  </Button>
                )}
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                {finishedHint}
              </Text>
            )}

            {waitingOther && (
              <Text size="xs" c="dimmed">
                {t('offers.actions.waitingOther')}
              </Text>
            )}
          </Stack>

          <Divider orientation="vertical" visibleFrom="sm" />
          <Divider hiddenFrom="sm" />

          <Stack gap={8} className={styles.sideZone}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {t('offers.actions.helpZone')}
            </Text>

            <Group gap="xs" wrap="wrap">
              <Button
                variant="default"
                leftSection={<MessageCircle size={16} />}
                onClick={onChat}
              >
                {t('offers.chat.button')}
              </Button>

              <Button
                variant="subtle"
                color="red"
                leftSection={<Flag size={16} />}
                onClick={() => setPendingAction('report')}
              >
                {t('offers.report.button')}
              </Button>
            </Group>
          </Stack>
        </div>
      </Paper>

      <ConfirmModal
        opened={pendingAction !== null}
        title={meta?.title}
        message={meta?.message}
        confirmLabel={meta?.confirmLabel ?? ''}
        cancelLabel={t('offers.cancel')}
        confirmColor={meta?.confirmColor}
        loading={meta?.loading ?? false}
        onConfirm={runPendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
};
