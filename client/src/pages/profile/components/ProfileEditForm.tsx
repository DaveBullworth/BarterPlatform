import { useCallback, useState } from 'react';
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
import type { Country } from '@/types/country';
import type { UserRole } from '@/shared/constants/user-role';

type FormValues = {
  name: string;
  login: string;
  phone: string;
  email?: string;
  password?: string;
  status?: boolean;
  statusEmail?: boolean;
  role?: UserRole;
};

type Props = {
  user: SelfUserDto | AdminUserDto;
  selectedCountry: Country | null;
  onCountryMissing: () => void;
  onUpdated: (user: SelfUserDto | AdminUserDto) => void;
  onClose: () => void;
};

export const ProfileEditForm = ({
  user,
  selectedCountry,
  onCountryMissing,
  onUpdated,
  onClose,
}: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const isAdminMode = isAdminUser(user);

  const form = useForm<FormValues>({
    initialValues: {
      name: user.name ?? '',
      login: user.login ?? '',
      phone: user.phone ?? '',
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
      ...(isAdminMode && {
        email: (value) => {
          if (!value) return null;
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

  const hasChanges =
    form.isDirty() ||
    selectedCountry?.id !== user.country?.id ||
    (isAdminMode &&
      (form.values.email !== user.email ||
        form.values.password ||
        form.values.status !== user.status ||
        form.values.statusEmail !== user.statusEmail));

  const handleSubmit = useCallback(
    async (values: FormValues) => {
      if (!selectedCountry) {
        onCountryMissing();
        return;
      }

      const payload: Record<string, unknown> = {};

      if (values.name !== (user.name ?? '')) payload.name = values.name;
      if (values.login !== (user.login ?? '')) payload.login = values.login;

      const phone = values.phone || null;
      if ((user.phone ?? null) !== phone) payload.phone = phone;

      if (user.country?.id !== selectedCountry.id) {
        payload.countryId = selectedCountry.id;
      }

      // Admin-only fields
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
    [
      user,
      selectedCountry,
      onUpdated,
      onClose,
      onCountryMissing,
      t,
      form,
      isAdminMode,
    ],
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="sm">
        <TextInput
          label={t('auth.name')}
          leftSection={<User size={16} />}
          {...form.getInputProps('name')}
        />

        <TextInput
          label={t('auth.login')}
          leftSection={<AtSign size={16} />}
          {...form.getInputProps('login')}
        />

        <PhoneInput
          phone={form.values.phone}
          countryCode={selectedCountry?.phoneCode}
          error={form.errors.phone}
          onChange={(v) => form.setFieldValue('phone', v)}
        />

        {/* Admin-only fields */}
        {isAdminMode && (
          <>
            <TextInput
              leftSection={<Mail size={16} />}
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              leftSection={<LockKeyhole size={16} />}
              label={t('auth.password')}
              placeholder={t('auth.passwordPlaceholder')}
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
