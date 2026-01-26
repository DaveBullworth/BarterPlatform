import { Text, Group, Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import type { TFunction } from 'i18next';
import type { NavigateFunction } from 'react-router-dom';

import { goToAuth } from '@/shared/utils/navigation';

export const openAuthRequiredModal = (
  navigate: NavigateFunction,
  t: TFunction,
) => {
  modals.open({
    title: (
      <Text fw={700} size="lg" td="underline">
        {t('authRequired.title')}
      </Text>
    ),
    overlayProps: {
      backgroundOpacity: 0.55,
      blur: 3,
    },
    children: (
      <>
        <Text mb="sm">{t('authRequired.text')}</Text>
        <Text size="sm" c="dimmed" mb="md">
          {t('authRequired.question')}
        </Text>
        <Group justify="flex-end">
          <Button
            onClick={() => {
              goToAuth(navigate);
              modals.closeAll();
            }}
          >
            {t('authRequired.login')}
          </Button>
          <Button variant="default" onClick={() => modals.closeAll()}>
            {t('authRequired.cancel')}
          </Button>
        </Group>
      </>
    ),
    centered: true,
  });
};
