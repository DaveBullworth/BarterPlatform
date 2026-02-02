import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Group, Button, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { User, AtSign } from 'lucide-react';

import { PhoneInput } from '@/pages/auth/components/PhoneInput';
import { updateSelfUser } from '@/http/user';
import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';
import {
  phoneValidator,
  createLengthValidator,
} from '@/shared/utils/validators';

import type { SelfUserDto } from '@/types/user';
import type { Country } from '@/types/country';

type FormValues = {
  name: string;
  login: string;
  phone: string;
};

type Props = {
  user: SelfUserDto;
  selectedCountry: Country | null;
  onCountryMissing: () => void;
  onUpdated: (user: SelfUserDto) => void;
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

  const form = useForm<FormValues>({
    initialValues: {
      name: user.name ?? '',
      login: user.login ?? '',
      phone: user.phone ?? '',
    },
    validate: {
      name: createLengthValidator(t, 'auth.name', { min: 5, max: 200 }),
      login: createLengthValidator(t, 'auth.login', { min: 8, max: 60 }),
      phone: phoneValidator(t),
    },
  });

  const hasChanges = form.isDirty() || selectedCountry?.id !== user.country?.id;

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

      if (!Object.keys(payload).length) {
        form.reset();
        onClose();
        return;
      }

      setLoading(true);
      try {
        const updatedUser = await updateSelfUser(payload);

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
    [user, selectedCountry, onUpdated, onClose, onCountryMissing, t, form],
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
