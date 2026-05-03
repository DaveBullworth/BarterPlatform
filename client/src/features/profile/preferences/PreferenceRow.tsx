import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { useDisclosure } from '@mantine/hooks';
import { Badge, Divider, Group, Popover, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import styles from './ProfilePreferencesBlock.module.scss';

type PreferenceRowProps = {
  icon: ReactNode;
  label: string;
  isOutdated: boolean;
  control: ReactNode;
};

export const PreferenceRow = ({
  icon,
  label,
  isOutdated,
  control,
}: PreferenceRowProps) => {
  const { t } = useTranslation();
  const [opened, { close, open }] = useDisclosure(false);

  return (
    <Badge
      fullWidth
      radius="md"
      variant="light"
      className={styles.contactBadge}
    >
      <Group gap="sm" wrap="nowrap">
        <Group gap={6} className={styles.contactLabel} wrap="nowrap">
          {icon}
          <Text size="sm" fw={500}>
            {label}
          </Text>
        </Group>

        <Divider orientation="vertical" />

        <Group gap="xs" wrap="nowrap" className={styles.contactValue}>
          {control}

          {isOutdated && (
            <Popover width={260} position="top" withArrow opened={opened}>
              <Popover.Target>
                <Info
                  size={20}
                  color="red"
                  onMouseEnter={open}
                  onMouseLeave={close}
                  style={{ cursor: 'pointer' }}
                />
              </Popover.Target>
              <Popover.Dropdown style={{ pointerEvents: 'none' }}>
                <Text size="sm">{t('profile.settingMissmatch')}</Text>
              </Popover.Dropdown>
            </Popover>
          )}
        </Group>
      </Group>
    </Badge>
  );
};
