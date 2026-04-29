import { TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BELARUS_PHONE_CODE } from '@/shared/constants/country';

type Props = {
  value?: string;
  countryCode?: number;
  error?: React.ReactNode;
  onChange: (value: string) => void;
};

export const PhoneInput = ({
  value,
  countryCode = BELARUS_PHONE_CODE,
  error,
  onChange,
}: Props) => {
  const { t } = useTranslation();

  return (
    <TextInput
      label={t('auth.phone')}
      placeholder={t('auth.phonePlaceholder')}
      error={error}
      leftSection={`+${countryCode}`}
      leftSectionWidth="3rem"
      value={value ?? ''}
      onChange={(e) => {
        const digits = e.currentTarget.value.replace(/\D/g, '');
        if (digits.length <= 11) onChange(digits);
      }}
    />
  );
};
