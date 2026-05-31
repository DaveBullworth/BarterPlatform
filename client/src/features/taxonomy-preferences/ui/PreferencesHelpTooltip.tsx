import { ActionIcon, HoverCard, List, Stack, Text } from '@mantine/core';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PreferencesHelpTooltip = () => {
  const { t } = useTranslation();

  return (
    <HoverCard width={340} shadow="md" position="bottom-end" withArrow>
      <HoverCard.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          radius="xl"
          aria-label={t('preferences.help.iconAria')}
        >
          <Info size={18} />
        </ActionIcon>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Stack gap={8}>
          <Text fw={600} size="sm">
            {t('preferences.help.title')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('preferences.help.intro')}
          </Text>
          <List size="xs" spacing={4} withPadding>
            <List.Item>{t('preferences.help.level1')}</List.Item>
            <List.Item>{t('preferences.help.level2')}</List.Item>
            <List.Item>{t('preferences.help.level3')}</List.Item>
          </List>
          <Text size="xs" c="dimmed">
            {t('preferences.help.geo')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('preferences.help.notes')}
          </Text>
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
};
