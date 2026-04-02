import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Mail, User, AtSign, LockKeyhole } from 'lucide-react';
import { PhoneInput } from './PhoneInput';
import {
  createLengthValidator,
  createEmailValidator,
  required,
  phoneValidator,
} from '@/shared/utils/validators';
import { BELARUS_PHONE_CODE } from '@/shared/constants/country';
import { getRegions, getCities, getDistricts } from '@/http/geography';
import type { CityOption, DistrictOption, RegionOption } from '@/types/geo.dto';

type RegisterFormValues = {
  email: string;
  login: string;
  name: string;
  password: string;
  phone?: string;
  regionId: string;
  cityId: string;
  districtId: string;
  agree: boolean;
};

type RegisterFormProps = {
  onBackToLogin: () => void;
  onSubmit: (values: RegisterFormValues) => void | Promise<void>;
  blockTimer: number;
};

export const RegisterForm = ({
  onBackToLogin,
  onSubmit,
  blockTimer,
}: RegisterFormProps) => {
  const { t } = useTranslation();
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');

  const form = useForm<RegisterFormValues>({
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
      email: (value) => {
        if (!value) return null;
        const lengthError = createLengthValidator(t, 'auth.email', {
          min: 8,
          max: 200,
        })(value);
        if (lengthError) return lengthError;
        return createEmailValidator(t)(value);
      },
      login: createLengthValidator(t, 'auth.login', { min: 8, max: 60 }),
      name: createLengthValidator(t, 'auth.name', { min: 5, max: 200 }),
      password: createLengthValidator(t, 'auth.password', { min: 8, max: 60 }),
      phone: phoneValidator(t),
      regionId: required(t, 'auth.region'),
      cityId: required(t, 'auth.city'),
      agree: required(t, 'auth.agree'),
    },
  });

  useEffect(() => {
    getRegions().then(setRegions).catch(console.error);
  }, []);

  const regionOptions = useMemo(
    () =>
      [...regions]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => ({ value: String(r.id), label: r.name })),
    [regions],
  );

  const cityOptions = useMemo(
    () =>
      [...cities]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => ({ value: String(c.id), label: c.name })),
    [cities],
  );

  const districtOptions = useMemo(
    () =>
      [...districts]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({ value: String(d.id), label: d.name })),
    [districts],
  );

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="sm">
        <Select
          required
          label={t('auth.region')}
          placeholder={t('auth.selectRegion')}
          data={regionOptions}
          searchable
          value={form.values.regionId}
          onChange={(value) => {
            form.setFieldValue('regionId', value || '');

            // сброс зависимостей
            form.setFieldValue('cityId', '');
            form.setFieldValue('districtId', '');

            setCities([]);
            setDistricts([]);
            setCitySearch('');
            setDistrictSearch('');

            if (value) {
              getCities(Number(value)).then(setCities).catch(console.error);
            }
          }}
        />
        <Select
          required
          label={t('auth.city')}
          placeholder={t('auth.selectCity')}
          data={cityOptions}
          searchable
          disabled={!form.values.regionId}
          value={form.values.cityId}
          searchValue={citySearch}
          onSearchChange={setCitySearch}
          onChange={(value) => {
            form.setFieldValue('cityId', value || '');

            // сброс района
            form.setFieldValue('districtId', '');
            setDistricts([]);
            setDistrictSearch('');

            if (value) {
              getDistricts(Number(value))
                .then(setDistricts)
                .catch(console.error);
            }
          }}
        />
        <Select
          label={t('auth.district')}
          placeholder={
            !form.values.cityId
              ? t('auth.cityNotSelected') // "Город не выбран"
              : districtOptions.length === 0
                ? t('profile.missed') // "Районы отсутствуют"
                : t('auth.selectDistrict') // "Выберите район"
          }
          data={districtOptions}
          clearable
          searchable
          searchValue={districtSearch}
          onSearchChange={setDistrictSearch}
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
          phone={form.values.phone}
          countryCode={BELARUS_PHONE_CODE}
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

        <Button fullWidth type="submit" disabled={blockTimer > 0}>
          {blockTimer > 0
            ? `${t('auth.register')} (${blockTimer})`
            : t('auth.register')}
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
