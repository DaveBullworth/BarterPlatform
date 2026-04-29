import { useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { User, AtSign, Mail, LockKeyhole } from 'lucide-react';

import { PhoneInput } from '@/shared/ui/PhoneInput';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { createMantineValidators } from '@/shared/lib/validators';
import {
  useRegionOptions,
  useCityOptions,
  useDistrictOptions,
} from '@/entities/geography';
import { isAdminUser, type SelfUser, type AdminUser } from '@/entities/user';
import { USER_ROLES, type UserRole } from '@/shared/constants/user-role';
import { useProfileEdit } from './useProfileEdit';

type FormValues = {
  name: string;
  login: string;
  phone: string;
  regionId: string;
  cityId: string;
  districtId: string;
  email: string;
  password: string;
  status: boolean;
  statusEmail: boolean;
  role: UserRole;
};

type Props = {
  user: SelfUser | AdminUser;
  role?: UserRole;
  onClose: () => void;
  onSuccess: (user: SelfUser | AdminUser) => void;
  onHasChangesChange?: (hasChanges: boolean) => void;
};

export const ProfileEditForm = ({
  user,
  role,
  onClose,
  onSuccess,
  onHasChangesChange,
}: Props) => {
  const { t } = useTranslation();
  const validators = createMantineValidators(t);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAdminMode = role === USER_ROLES.ADMIN && isAdminUser(user);

  const { save, isPending } = useProfileEdit({
    userId: user.id,
    isAdminMode,
    onSuccess,
  });

  // Геополя через React Query
  const [regionId, setRegionId] = useState<number | null>(
    user.region ? user.region.id : null,
  );
  const [cityId, setCityId] = useState<number | null>(
    user.city ? user.city.id : null,
  );
  const regionOptions = useRegionOptions();
  const cityOptions = useCityOptions(regionId);
  const districtOptions = useDistrictOptions(cityId);

  const form = useForm<FormValues>({
    initialValues: {
      name: user.name ?? '',
      login: user.login ?? '',
      phone: user.phone ?? '',
      regionId: user.region ? String(user.region.id) : '',
      cityId: user.city ? String(user.city.id) : '',
      districtId: user.district ? String(user.district.id) : '',
      email: isAdminMode ? user.email : '',
      password: '',
      status: isAdminMode ? user.status : true,
      statusEmail: isAdminMode ? user.statusEmail : true,
      role: isAdminMode ? user.role : USER_ROLES.USER,
    },
    validate: {
      name: validators.name,
      login: validators.login,
      phone: validators.phone,
      regionId: validators.required('auth.region'),
      cityId: validators.required('auth.city'),
      ...(isAdminMode && {
        email: validators.email,
        password: (value) => (value ? validators.password(value) : null),
      }),
    },
    onValuesChange: () => {
      onHasChangesChange?.(form.isDirty());
    },
  });

  // Собираем только изменённые поля — отправляем минимальный payload
  const buildPayload = (values: FormValues): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};

    if (form.isDirty('name')) payload.name = values.name;
    if (form.isDirty('login')) payload.login = values.login;
    if (form.isDirty('phone')) payload.phone = values.phone || null;
    if (form.isDirty('regionId')) payload.regionId = Number(values.regionId);
    if (form.isDirty('cityId')) payload.cityId = Number(values.cityId);
    if (form.isDirty('districtId')) {
      payload.districtId = values.districtId ? Number(values.districtId) : null;
    }

    if (isAdminMode) {
      if (form.isDirty('email')) payload.email = values.email;
      if (values.password) payload.password = values.password;
      if (form.isDirty('status')) payload.status = values.status;
      if (form.isDirty('statusEmail')) payload.statusEmail = values.statusEmail;
      if (form.isDirty('role')) payload.role = values.role;
    }

    return payload;
  };

  const handleConfirm = () => {
    const payload = buildPayload(form.values);
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }
    save(payload);
    setConfirmOpen(false);
  };

  return (
    <>
      <form onSubmit={form.onSubmit(() => setConfirmOpen(true))}>
        <Stack gap="sm">
          <Select
            required
            placeholder={t('auth.selectRegion')}
            label={t('auth.region')}
            data={regionOptions}
            value={form.values.regionId}
            searchable
            onChange={(value) => {
              form.setFieldValue('regionId', value || '');
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
              form.setFieldValue('cityId', value || '');
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
            searchable
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
            value={form.values.phone}
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
                  { value: USER_ROLES.ADMIN, label: t('common.admin') },
                  { value: USER_ROLES.USER, label: t('common.user') },
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
            <Button variant="default" onClick={onClose} disabled={isPending}>
              {t('authRequired.cancel')}
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={!form.isDirty()}
            >
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>

      <ConfirmModal
        opened={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={t('profile.confirmTitle')}
        message={t('profile.confirmUpdateMessage')}
        confirmLabel={t('profile.confirmDiscardConfirm')}
        cancelLabel={t('profile.confirmDiscardCancel')}
        confirmColor="blue"
        loading={isPending}
      />
    </>
  );
};
