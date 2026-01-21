import { TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';

interface Props {
  phone?: string;
  countryCode?: number;
  onChange: (v: string) => void;
}

export const PhoneInput = ({ phone, countryCode, onChange }: Props) => {
  const { t } = useTranslation();

  return (
    <TextInput
      label={t('auth.phone')}
      placeholder={t('auth.phonePlaceholder')}
      leftSection={countryCode ? `+${countryCode}` : undefined}
      value={phone ?? ''}
      onChange={(e) => {
        const digits = e.currentTarget.value.replace(/\D/g, '');
        if (digits.length <= 11) {
          onChange(digits);
        }
      }}
    />
  );
};
