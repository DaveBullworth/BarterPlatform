import { Popover, Text, ActionIcon, Stack } from '@mantine/core';
import { HelpCircle } from 'lucide-react';

export const SupportPopover = () => {
  return (
    <Popover position="top-start" withArrow shadow="md">
      <Popover.Target>
        <ActionIcon variant="subtle">
          <HelpCircle size={18} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap={4}>
          <Text size="sm">Support</Text>
          <Text size="xs">Email: support@barter.dev</Text>
          <Text size="xs">Telegram: @barter_support</Text>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
