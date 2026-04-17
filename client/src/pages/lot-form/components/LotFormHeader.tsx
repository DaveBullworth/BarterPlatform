import { Badge, Group, Title } from '@mantine/core';
import type { TFunction } from 'i18next';

type Props = {
  isEditMode: boolean;
  isFormDirty: boolean;
  t: TFunction;
};

export const LotFormHeader = ({ isEditMode, isFormDirty, t }: Props) => {
  return (
    <Group justify="space-between" align="center">
      <Title order={2}>
        {isEditMode ? t('lotForm.title.edit') : t('lotForm.title.create')}
      </Title>

      <Badge color={isFormDirty ? 'yellow' : 'green'}>
        {isFormDirty ? t('lotForm.status.unsaved') : t('lotForm.status.saved')}
      </Badge>
    </Group>
  );
};
