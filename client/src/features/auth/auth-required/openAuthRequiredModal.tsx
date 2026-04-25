import { modals } from '@mantine/modals';
import { Button, Group, Stack, Text } from '@mantine/core';
import type { TFunction } from 'i18next';

// Остаётся функцией через modals.open — это правильно для императивных вызовов
export const openAuthRequiredModal = (
  onAuth: (replace?: boolean) => void,
  t: TFunction,
) => {
  modals.open({
    title: (
      <Text fw={700} size="lg" td="underline">
        {t('authRequired.title')}
      </Text>
    ),
    centered: true,
    overlayProps: { backgroundOpacity: 0.55, blur: 3 },
    children: (
      <Stack>
        <Text>{t('authRequired.text')}</Text>
        <Text size="sm" c="dimmed">
          {t('authRequired.question')}
        </Text>
        <Group justify="flex-end">
          <Button
            onClick={() => {
              onAuth(true);
              modals.closeAll();
            }}
          >
            {t('authRequired.login')}
          </Button>
          <Button variant="default" onClick={() => modals.closeAll()}>
            {t('authRequired.cancel')}
          </Button>
        </Group>
      </Stack>
    ),
  });
};
