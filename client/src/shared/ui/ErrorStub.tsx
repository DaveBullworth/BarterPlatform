import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CONFIG_BY_STATUS, DEFAULT_CONFIG } from '../constants/error-config';

type Props = {
  status?: number;
  onRetry?: () => void;
  onBack?: () => void;
};

export const ErrorStub = ({ status, onRetry, onBack }: Props) => {
  const { t } = useTranslation();
  const config = (status && CONFIG_BY_STATUS[status]) || DEFAULT_CONFIG;
  const Icon = config.icon;

  return (
    <Group
      justify="center"
      style={{
        width: '100%',
        height: '100%',
        alignSelf: 'center',
        marginTop: '50%',
      }}
    >
      <Stack align="center" gap="sm" maw={420}>
        {Icon && <Icon size={48} />}
        <Title order={3} ta="center">
          {t(config.titleKey)}
        </Title>
        <Text size="sm" c="dimmed" ta="center">
          {t(config.descKey)}
        </Text>

        {(onRetry || onBack) && (
          <Stack gap="xs" mt="md">
            {onRetry && <Button onClick={onRetry}>{t('common.retry')}</Button>}
            {onBack && (
              <Button variant="light" onClick={onBack}>
                {t('common.back')}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Group>
  );
};
