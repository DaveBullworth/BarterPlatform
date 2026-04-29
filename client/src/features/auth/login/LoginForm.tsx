import { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Group,
  Anchor,
  Stack,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { AtSign, LockKeyhole } from 'lucide-react';

import { createMantineValidators } from '@/shared/lib/validators';
import { ForgotPasswordModal } from '../forgot-password/ForgotPasswordModal';
import { SupportPopover } from './SupportPopover';
import { useLogin, type LoginDto } from './useLogin';

type Props = {
  onRegister: () => void;
};

type FormValues = LoginDto;

export const LoginForm = ({ onRegister }: Props) => {
  const { t } = useTranslation();
  const validators = createMantineValidators(t);
  const [forgotOpened, setForgotOpened] = useState(false);

  // Вся логика — в хуке
  const { login, isPending, blockTimer } = useLogin();

  const form = useForm<FormValues>({
    initialValues: { login: '', password: '', remember: true },
    validate: {
      login: validators.login,
      password: validators.password,
    },
  });

  return (
    <>
      <form onSubmit={form.onSubmit((values) => login(values))}>
        <Stack gap="sm">
          <TextInput
            variant="underline"
            label={t('auth.loginOrEmail')}
            leftSection={<AtSign size={16} />}
            placeholder={t('auth.loginOrEmailPlaceholder')}
            required
            {...form.getInputProps('login')}
          />

          <PasswordInput
            variant="underline"
            label={t('auth.password')}
            leftSection={<LockKeyhole size={16} />}
            placeholder={t('auth.passwordPlaceholder')}
            required
            {...form.getInputProps('password')}
          />

          <Group justify="space-between">
            <Checkbox
              label={t('auth.remember')}
              {...form.getInputProps('remember', { type: 'checkbox' })}
            />
            <Anchor
              size="sm"
              component="button"
              type="button"
              onClick={() => setForgotOpened(true)}
            >
              {t('auth.forgot')}
            </Anchor>
          </Group>

          <Button
            fullWidth
            type="submit"
            loading={isPending}
            disabled={blockTimer > 0}
          >
            {blockTimer > 0
              ? `${t('auth.submit')} (${blockTimer})`
              : t('auth.submit')}
          </Button>

          <Divider label={t('auth.or')} labelPosition="center" />

          <Group justify="space-between">
            <SupportPopover />
            <Anchor
              size="sm"
              component="button"
              type="button"
              onClick={onRegister}
            >
              {t('auth.register')}
            </Anchor>
          </Group>
        </Stack>
      </form>

      <ForgotPasswordModal
        opened={forgotOpened}
        onClose={() => setForgotOpened(false)}
      />
    </>
  );
};
