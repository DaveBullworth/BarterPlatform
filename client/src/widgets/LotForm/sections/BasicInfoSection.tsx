import {
  Text,
  TextInput,
  Textarea,
  NumberInput,
  SegmentedControl,
  Tooltip,
  Badge,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Info } from 'lucide-react';
import type { GetInputPropsReturnType } from '@mantine/form';

import styles from '../LotForm.module.scss';

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
    <div className={styles.fieldsStack}>
      <TextInput
        maxLength={255}
        label={t('lotForm.fields.generalDescription')}
        placeholder={t('lotForm.fields.generalDescriptionPlaceholder')}
        size="md"
        {...getInputProps('generalDescription')}
      />

      <Textarea
        maxLength={1000}
        label={t('lotForm.fields.characteristics')}
        minRows={4}
        maxRows={10}
        autosize
        size="md"
        placeholder={t('lotForm.fields.characteristicsPlaceholder')}
        {...getInputProps('characteristicsDescription')}
      />

      <div className={styles.bottomRow}>
        <NumberInput
          label={t('lotForm.fields.quantity')}
          placeholder={t('lotForm.fields.quantityPlaceholder')}
          size="md"
          min={1}
          max={10000}
          allowDecimal={false}
          {...getInputProps('quantity')}
        />

        {!isArchived ? (
          <div className={styles.visibilityRow}>
            <div className={styles.visibilityLabel}>
              <span className={styles.visibilityTitle}>
                {t('admin.filter.status')}
              </span>
              <span className={styles.visibilityHint}>
                {values.visibilityStatus
                  ? t('lotForm.visibility.visible')
                  : t('lotForm.visibility.hidden')}
              </span>
            </div>
            <div className={styles.visibilityControl}>
              <SegmentedControl
                size="sm"
                value={values.visibilityStatus ? 'visible' : 'hidden'}
                onChange={(value) =>
                  setFieldValue('visibilityStatus', value === 'visible')
                }
                data={[
                  { label: <Eye size={14} />, value: 'visible' },
                  { label: <EyeOff size={14} />, value: 'hidden' },
                ]}
              />
              <Tooltip
                label={t('lotForm.visibility.tooltip')}
                withArrow
                multiline
                w={260}
                position="top-end"
              >
                <Info
                  size={16}
                  color="var(--mantine-color-dimmed)"
                  style={{ cursor: 'help' }}
                />
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className={styles.visibilityRow}>
            <div className={styles.visibilityLabel}>
              <span className={styles.visibilityTitle}>
                {t('lot.visibility.archived')}
              </span>
              <Text size="xs" c="dimmed">
                {values.archivationDate
                  ? new Date(values.archivationDate).toLocaleDateString()
                  : '—'}
              </Text>
            </div>
            <Badge color="gray" variant="light" size="lg">
              ✕
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};
