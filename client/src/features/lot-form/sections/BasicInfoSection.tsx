import {
  Card,
  Stack,
  Text,
  TextInput,
  Textarea,
  Group,
  NumberInput,
  SegmentedControl,
  Tooltip,
  Badge,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, BadgeQuestionMark } from 'lucide-react';
import type { GetInputPropsReturnType } from '@mantine/form';

type Props = {
  values: {
    visibilityStatus: boolean;
    archivationDate?: string | null;
  };
  isArchived: boolean;
  getInputProps: (
    field: 'generalDescription' | 'characteristicsDescription' | 'quantity',
  ) => GetInputPropsReturnType;
  setFieldValue: (field: string, value: boolean) => void;
};

export const BasicInfoSection = ({
  values,
  isArchived,
  getInputProps,
  setFieldValue,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Card withBorder radius="md" p="md">
      <Stack>
        <Text fw={700}>{t('lotForm.fields.title')}</Text>

        <TextInput
          maxLength={255}
          label={t('lotForm.fields.generalDescription')}
          placeholder={t('lotForm.fields.generalDescriptionPlaceholder')}
          {...getInputProps('generalDescription')}
        />

        <Textarea
          maxLength={1000}
          label={t('lotForm.fields.characteristics')}
          minRows={6}
          maxRows={10}
          autosize
          placeholder={t('lotForm.fields.characteristicsPlaceholder')}
          {...getInputProps('characteristicsDescription')}
        />

        <Group justify="space-between" align="center">
          <NumberInput
            label={t('lotForm.fields.quantity')}
            placeholder={t('lotForm.fields.quantityPlaceholder')}
            min={1}
            max={10000}
            allowDecimal={false}
            {...getInputProps('quantity')}
          />

          {!isArchived ? (
            <Stack gap="0" justify="space-between" style={{ height: 60 }}>
              <Text size="sm" fw={500} style={{ lineHeight: '1.55' }}>
                {t('admin.filter.status')}
              </Text>

              <Group>
                <SegmentedControl
                  size="md"
                  value={values.visibilityStatus ? 'visible' : 'hidden'}
                  onChange={(value) =>
                    setFieldValue('visibilityStatus', value === 'visible')
                  }
                  data={[
                    {
                      label: (
                        <Group gap={6} wrap="nowrap" align="self-end">
                          <Eye size={16} />
                          <Text size="sm" fw={500}>
                            {t('lotForm.visibility.visible')}
                          </Text>
                        </Group>
                      ),
                      value: 'visible',
                    },
                    {
                      label: (
                        <Group gap={6} wrap="nowrap" align="self-end">
                          <EyeOff size={16} />
                          <Text size="sm" fw={500}>
                            {t('lotForm.visibility.hidden')}
                          </Text>
                        </Group>
                      ),
                      value: 'hidden',
                    },
                  ]}
                />

                <Tooltip label={t('lotForm.visibility.tooltip')}>
                  <BadgeQuestionMark size={16} style={{ cursor: 'pointer' }} />
                </Tooltip>
              </Group>
            </Stack>
          ) : (
            <Stack gap="0" justify="space-between" style={{ height: 60 }}>
              <Text size="sm" fw={500} style={{ lineHeight: '1.8' }}>
                {t('lot.visibility.archived')}
              </Text>

              <Badge color="gray" size="lg" style={{ alignItems: 'baseline' }}>
                {values.archivationDate
                  ? new Date(values.archivationDate).toLocaleDateString()
                  : '—'}
              </Badge>
            </Stack>
          )}
        </Group>
      </Stack>
    </Card>
  );
};
