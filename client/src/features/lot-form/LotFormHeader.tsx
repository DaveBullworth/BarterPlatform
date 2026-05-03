import { Badge, Group, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  isEditMode: boolean;
  isFormDirty: boolean;
};

export const LotFormHeader = ({ isEditMode, isFormDirty }: Props) => {
  const { t } = useTranslation();

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
