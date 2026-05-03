import { Badge, Box, Divider, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './ProfileContactsBlock.module.scss';

type InfoRowProps = {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
};

export const InfoRow = ({ icon, label, value }: InfoRowProps) => {
  const { t } = useTranslation();

  return (
    <Badge
      variant="light"
      radius="md"
      className={styles.contactBadge}
      fullWidth
    >
      <Group gap="sm" wrap="nowrap">
        <Group gap={6} className={styles.contactLabel} wrap="nowrap">
          {icon}
          <Text size="sm" fw={500}>
            {label}
          </Text>
        </Group>
        <Divider orientation="vertical" />
        <Box className={styles.contactValue}>
          {value ?? (
            <Text size="sm" c="dimmed" fs="italic">
              {t('profile.missed')}
            </Text>
          )}
        </Box>
      </Group>
    </Badge>
  );
};
