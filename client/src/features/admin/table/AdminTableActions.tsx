import { Group, Tooltip, ActionIcon } from '@mantine/core';
import { ListRestart, Save, SaveOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  hasSorting: boolean;
  onResetSorting: () => void;
  onSaveSizing: () => void;
  onResetSizing: () => void;
};

export const AdminTableActions = ({
  hasSorting,
  onResetSorting,
  onSaveSizing,
  onResetSizing,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Group justify="flex-start">
      {hasSorting && (
        <Tooltip label={t('admin.resetSorting')} withArrow>
          <ActionIcon
            variant="light"
            size="sm"
            color="lime"
            onClick={onResetSorting}
          >
            <ListRestart size={18} />
          </ActionIcon>
        </Tooltip>
      )}

      <Tooltip label={t('admin.saveColumnsPreset')} withArrow>
        <ActionIcon variant="light" size="sm" onClick={onSaveSizing}>
          <Save size={18} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label={t('admin.resetColumnsPreset')} withArrow>
        <ActionIcon
          variant="light"
          size="sm"
          color="red"
          onClick={onResetSizing}
        >
          <SaveOff size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
};
