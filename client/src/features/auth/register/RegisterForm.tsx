import { useState } from 'react';
import {
  Stack,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Anchor,
  Text,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { Mail, User, AtSign, LockKeyhole } from 'lucide-react';

import { createMantineValidators } from '@/shared/lib/validators';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import {
  useRegionOptions,
  useCityOptions,
  useDistrictOptions,
} from '@/entities/geography';
import { useRegister, type RegisterDto } from './useRegister';

type FormValues = RegisterDto & {
  agree: boolean;
};

type Props = {
  onBackToLogin: () => void;
};

export const RegisterForm = ({ onBackToLogin }: Props) => {
  const { t } = useTranslation();
  const validators = createMantineValidators(t);

  // Вместо useState + useEffect + useMemo — три строки
  const regionOptions = useRegionOptions();
  const [regionId, setRegionId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const cityOptions = useCityOptions(regionId);
  const districtOptions = useDistrictOptions(cityId);

  const form = useForm<FormValues>({
    initialValues: {
      email: '',
      login: '',
      name: '',
      password: '',
      phone: '',
      regionId: '',
      cityId: '',
      districtId: '',
      agree: false,
    },
    validate: {
      email: validators.email,
      login: validators.login,
      name: validators.name,
      password: validators.password,
      phone: validators.phone,
      regionId: validators.required('auth.region'),
      cityId: validators.required('auth.city'),
      agree: (v) => (!v ? t('auth.mustAgree') : null),
    },
  });

  const { register, isPending } = useRegister(onBackToLogin);

  return (
    <form onSubmit={form.onSubmit((values) => register(values))}>
      <Stack gap="sm">
        <Select
          required
          label={t('auth.region')}
          placeholder={t('auth.selectRegion')}
          data={regionOptions}
          searchable
          value={form.values.regionId}
          onChange={(value) => {
            form.setFieldValue('regionId', value ?? '');
            form.setFieldValue('cityId', '');
            form.setFieldValue('districtId', '');
            setRegionId(value ? Number(value) : null);
            setCityId(null);
          }}
        />

        <Select
          key={`city-${form.values.regionId || 'empty'}`}
          required
          label={t('auth.city')}
          placeholder={t('auth.selectCity')}
          data={cityOptions}
          searchable
          disabled={!form.values.regionId}
          value={form.values.cityId}
          onChange={(value) => {
            form.setFieldValue('cityId', value ?? '');
            form.setFieldValue('districtId', '');
            setCityId(value ? Number(value) : null);
          }}
        />

        <Select
          key={`district-${form.values.cityId || 'empty'}`}
          label={t('auth.district')}
          placeholder={
            !form.values.cityId
              ? t('auth.cityNotSelected')
              : districtOptions.length === 0
                ? t('profile.missed')
                : t('auth.selectDistrict')
          }
          data={districtOptions}
          clearable
          searchable
          disabled={!form.values.cityId || districtOptions.length === 0}
          {...form.getInputProps('districtId')}
        />

        <TextInput
          variant="underline"
          leftSection={<Mail size={16} />}
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          maxLength={200}
          required
          {...form.getInputProps('email')}
        />

        <TextInput
          variant="underline"
          leftSection={<AtSign size={16} />}
          label={t('auth.login')}
          placeholder={t('auth.loginPlaceholder')}
          maxLength={60}
          required
          {...form.getInputProps('login')}
        />

        <TextInput
          variant="underline"
          leftSection={<User size={16} />}
          label={t('auth.name')}
          placeholder={t('auth.namePlaceholder')}
          maxLength={200}
          required
          {...form.getInputProps('name')}
        />

        <PasswordInput
          variant="underline"
          leftSection={<LockKeyhole size={16} />}
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder')}
          maxLength={60}
          required
          {...form.getInputProps('password')}
        />

        <PhoneInput
          value={form.values.phone}
          error={form.errors.phone}
          onChange={(v) => form.setFieldValue('phone', v)}
        />

        <Checkbox
          {...form.getInputProps('agree', { type: 'checkbox' })}
          label={
            <Text size="sm" component="span">
              {t('auth.agreeText')}
              <Text size="xs" c="dimmed">
                {t('auth.systemCookiesInfo')}
              </Text>
            </Text>
          }
          required
        />

        <Button fullWidth type="submit" loading={isPending}>
          {t('auth.register')}
        </Button>

        <Anchor
          size="sm"
          component="button"
          type="button"
          ta="center"
          onClick={onBackToLogin}
        >
          {t('auth.backToLogin')}
        </Anchor>
      </Stack>
    </form>
  );
};
