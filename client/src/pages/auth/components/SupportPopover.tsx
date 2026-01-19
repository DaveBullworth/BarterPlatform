import type { ReactNode } from 'react';
import {
  Popover,
  Text,
  ActionIcon,
  Stack,
  Group,
  Divider,
  Box,
  ThemeIcon,
  CopyButton,
  Tooltip,
} from '@mantine/core';
import { notify } from '@/shared/utils/notifications';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Mail, Send, Copy, Check } from 'lucide-react';

const SUPPORT_EMAIL = 'support@barter.dev';
const SUPPORT_TELEGRAM = '@barter_support';

type SupportRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

const SupportRow = ({ icon, label, value }: SupportRowProps) => {
  const { t } = useTranslation();

  const handleCopy = () => {
    notify({
      message: `${label} ${t('auth.copied')}`,
      icon: <Check size={14} />,
      color: 'teal',
      autoClose: 2000,
    });
  };

  return (
    <Group justify="space-between" gap="xs">
      <Group gap="xs">
        <ThemeIcon variant="light" size="sm" radius="md">
          {icon}
        </ThemeIcon>

        <Box>
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Text size="sm" fw={500}>
            {value}
          </Text>
        </Box>
      </Group>

      <CopyButton value={value}>
        {({ copy }) => (
          <Tooltip label="Скопировать" withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => {
                copy();
                handleCopy();
              }}
            >
              <Copy size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
};

export const SupportPopover = () => {
  const { t } = useTranslation();

  return (
    <Popover position="top-start" withArrow shadow="md" radius="md">
      <Popover.Target>
        <ActionIcon variant="subtle" radius="md" size="md">
          <HelpCircle size={18} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown p="sm" w={260}>
        <Stack gap="sm">
          <Text size="sm" fw={600}>
            {t('auth.support')}
          </Text>

          <Divider />

          <SupportRow
            icon={<Mail size={14} />}
            label="Email"
            value={SUPPORT_EMAIL}
          />

          <Divider variant="dashed" />

          <SupportRow
            icon={<Send size={14} />}
            label="Telegram"
            value={SUPPORT_TELEGRAM}
          />
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
