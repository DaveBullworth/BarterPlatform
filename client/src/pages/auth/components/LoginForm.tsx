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
import { SupportPopover } from './SupportPopover';

type LoginFormValues = {
  login: string;
  password: string;
  remember: boolean;
};

export const LoginForm = () => {
  const form = useForm<LoginFormValues>({
    initialValues: {
      login: '',
      password: '',
      remember: true,
    },
    validate: {
      login: (v) => (v.length < 3 ? 'Enter login or email' : null),
      password: (v) => (v.length < 6 ? 'Password is too short' : null),
    },
  });

  const handleSubmit = (values: LoginFormValues) => {
    console.log('login submit', values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="sm">
        <TextInput
          label="Login or email"
          placeholder="your@email.com"
          required
          {...form.getInputProps('login')}
        />

        <PasswordInput
          label="Password"
          placeholder="••••••••"
          required
          {...form.getInputProps('password')}
        />

        <Group justify="space-between">
          <Checkbox
            label="Remember me"
            {...form.getInputProps('remember', { type: 'checkbox' })}
          />

          <Anchor size="sm" component="button" type="button">
            Forgot password?
          </Anchor>
        </Group>

        <Button fullWidth type="submit">
          Sign in
        </Button>

        <Divider label="or" labelPosition="center" />

        <Group justify="space-between">
          <SupportPopover />

          <Anchor size="sm" component="button" type="button">
            Create account
          </Anchor>
        </Group>
      </Stack>
    </form>
  );
};
