import { useTranslation } from 'react-i18next';
import {
  Stack,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Anchor,
  Text,
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
import type { Country } from '@/types/country';

type RegisterFormValues = {
  email: string;
  login: string;
  name: string;
  password: string;
  phone?: string;
  agree: boolean;
};

type RegisterFormProps = {
  onBackToLogin: () => void;
  onSubmit: (values: RegisterFormValues) => void | Promise<void>;
  blockTimer: number;
  selectedCountry: Country | null;
};

export const RegisterForm = ({
  onBackToLogin,
  onSubmit,
  blockTimer,
  selectedCountry,
}: RegisterFormProps) => {
  const { t } = useTranslation();

  const form = useForm<RegisterFormValues>({
    initialValues: {
      email: '',
      login: '',
      name: '',
      password: '',
      phone: '',
      agree: false,
    },
    validate: {
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
      login: createLengthValidator(t, 'auth.login', { min: 8, max: 60 }),
      name: createLengthValidator(t, 'auth.name', { min: 5, max: 200 }),
      password: createLengthValidator(t, 'auth.password', {
        min: 8,
        max: 60,
      }),
      phone: phoneValidator(t),
      agree: required(t, 'auth.agree'),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="sm">
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

        <PhoneInput
          phone={form.values.phone}
          countryCode={selectedCountry?.phoneCode}
          error={form.errors.phone}
          onChange={(v) => form.setFieldValue('phone', v)}
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
