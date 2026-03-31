import { TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BELARUS_PHONE_CODE } from '@/shared/constants/country';

interface Props {
  phone?: string;
  countryCode?: number;
  error?: React.ReactNode;
  onChange: (v: string) => void;
}

export const PhoneInput = ({ phone, countryCode, error, onChange }: Props) => {
  const { t } = useTranslation();

  return (
    <TextInput
      label={t('auth.phone')}
      placeholder={t('auth.phonePlaceholder')}
      error={error}
      leftSection={`+${countryCode ?? BELARUS_PHONE_CODE}`}
      leftSectionWidth={'3rem'}
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
