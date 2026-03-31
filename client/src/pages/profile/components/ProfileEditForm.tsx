import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack,
  Group,
  Button,
  TextInput,
  PasswordInput,
  Checkbox,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { User, AtSign, Mail, LockKeyhole } from 'lucide-react';

import { PhoneInput } from '@/pages/auth/components/PhoneInput';
import { updateSelfUser, updateUserByAdmin } from '@/http/user';
import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';
import { isAdminUser } from './guard';
import {
  phoneValidator,
  createLengthValidator,
  createEmailValidator,
} from '@/shared/utils/validators';

import type { AdminUserDto, SelfUserDto } from '@/types/user';
import { USER_ROLES, type UserRole } from '@/shared/constants/user-role';
import { BELARUS_PHONE_CODE } from '@/shared/constants/country';
import { getRegions, getCities, getDistricts } from '@/http/geography';
import type { DistrictOption, GeoOption } from '@/types/geo.dto';

type FormValues = {
  name: string;
  login: string;
  phone: string;
  regionId: string;
  cityId: string;
  districtId: string;
  email?: string;
  password?: string;
  status?: boolean;
  statusEmail?: boolean;
  role?: UserRole;
};

type Props = {
  user: SelfUserDto | AdminUserDto;
  role?: UserRole;
  onUpdated: (user: SelfUserDto | AdminUserDto) => void;
  onClose: () => void;
};

export const ProfileEditForm = ({ user, role, onUpdated, onClose }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<GeoOption[]>([]);
  const [cities, setCities] = useState<GeoOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');

  const isAdminMode = role === USER_ROLES.ADMIN && isAdminUser(user);

  const form = useForm<FormValues>({
    initialValues: {
      name: user.name ?? '',
      login: user.login ?? '',
      phone: user.phone ?? '',
      regionId: user.region ? String(user.region.id) : '',
      cityId: user.city ? String(user.city.id) : '',
      districtId: user.district ? String(user.district.id) : '',
      email: isAdminMode ? (user.email ?? '') : undefined,
      password: '',
      status: isAdminMode ? user.status : undefined,
      statusEmail: isAdminMode ? user.statusEmail : undefined,
      role: isAdminMode ? (user.role ?? 'user') : undefined,
    },
    validate: {
      name: createLengthValidator(t, 'auth.name', { min: 5, max: 200 }),
      login: createLengthValidator(t, 'auth.login', { min: 8, max: 60 }),
      phone: phoneValidator(t),
      regionId: (v) => (!v ? t('auth.region') : null),
      cityId: (v) => (!v ? t('auth.city') : null),
      ...(isAdminMode && {
        email: (value) => {
          if (!value) return null;

          const lengthError = createLengthValidator(t, 'auth.email', {
            min: 8,
            max: 200,
          })(value);

          if (lengthError) {
            return lengthError;
          }

          return createEmailValidator(t)(value);
        },
        password: (value) => {
          if (!value) return null;
          return createLengthValidator(t, 'auth.password', { min: 8, max: 60 })(
            value,
          );
        },
      }),
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

  const hasChanges =
    form.isDirty() ||
    (isAdminMode &&
      (form.values.email !== user.email ||
        form.values.password ||
        form.values.status !== user.status ||
        form.values.statusEmail !== user.statusEmail));

  const handleSubmit = useCallback(
    async (values: FormValues) => {
      const payload: Record<string, unknown> = {};

      if (values.name !== (user.name ?? '')) payload.name = values.name;
      if (values.login !== (user.login ?? '')) payload.login = values.login;

      const phone = values.phone || null;
      if ((user.phone ?? null) !== phone) payload.phone = phone;

      if (values.regionId !== (user.region ? String(user.region.id) : '')) {
        payload.regionId = Number(values.regionId);
      }

      if (values.cityId !== (user.city ? String(user.city.id) : '')) {
        payload.cityId = Number(values.cityId);
      }

      if (
        values.districtId !== (user.district ? String(user.district.id) : '')
      ) {
        payload.districtId = values.districtId
          ? Number(values.districtId)
          : null;
      }

      if (isAdminMode) {
        if (values.email !== user.email) payload.email = values.email;
        if (values.password) payload.password = values.password;
        if (values.status !== user.status) payload.status = values.status;
        if (values.statusEmail !== user.statusEmail)
          payload.statusEmail = values.statusEmail;
        if (values.role !== user.role) payload.role = values.role;
      }

      if (!Object.keys(payload).length) {
        form.reset();
        onClose();
        return;
      }

      setLoading(true);
      try {
        const updatedUser = isAdminMode
          ? await updateUserByAdmin(user.id, payload)
          : await updateSelfUser(payload);

        notify({
          message: t('profile.dataUpdated'),
          color: 'green',
        });

        onUpdated(updatedUser);
        form.reset();
        onClose();
      } catch (e) {
        handleApiError(e, t);
      } finally {
        setLoading(false);
      }
    },
    [user, onUpdated, onClose, t, form, isAdminMode],
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="sm">
        <Select
          required
          placeholder={t('auth.selectRegion')}
          label={t('auth.region')}
          data={regionOptions}
          searchable
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
          searchable
          searchValue={districtSearch}
          onSearchChange={setDistrictSearch}
          clearable
          disabled={!form.values.cityId || districtOptions.length === 0}
          {...form.getInputProps('districtId')}
        />

        <TextInput
          label={t('auth.name')}
          placeholder={t('auth.namePlaceholder')}
          leftSection={<User size={16} />}
          maxLength={200}
          {...form.getInputProps('name')}
        />

        <TextInput
          label={t('auth.login')}
          placeholder={t('auth.loginPlaceholder')}
          leftSection={<AtSign size={16} />}
          maxLength={60}
          {...form.getInputProps('login')}
        />

        <PhoneInput
          phone={form.values.phone}
          countryCode={BELARUS_PHONE_CODE}
          error={form.errors.phone}
          onChange={(v) => form.setFieldValue('phone', v)}
        />

        {isAdminMode && (
          <>
            <TextInput
              leftSection={<Mail size={16} />}
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              required
              maxLength={200}
              {...form.getInputProps('email')}
            />
            <PasswordInput
              leftSection={<LockKeyhole size={16} />}
              label={t('auth.password')}
              placeholder={t('auth.passwordPlaceholder')}
              maxLength={60}
              {...form.getInputProps('password')}
            />
            <Select
              label={t('common.role')}
              placeholder={t('common.role')}
              data={[
                { value: 'admin', label: t('common.admin') },
                { value: 'user', label: t('common.user') },
              ]}
              {...form.getInputProps('role')}
            />
            <Checkbox
              label={t('common.status')}
              {...form.getInputProps('status', { type: 'checkbox' })}
            />
            <Checkbox
              label={t('common.statusEmail')}
              {...form.getInputProps('statusEmail', { type: 'checkbox' })}
            />
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={loading}>
            {t('authRequired.cancel')}
          </Button>
          <Button type="submit" loading={loading} disabled={!hasChanges}>
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
