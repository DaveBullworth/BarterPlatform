import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  Popover,
  Button,
  Center,
  Alert,
} from '@mantine/core';
import { Modal } from '@mantine/core';
import {
  Palette,
  Languages,
  Info,
  ChevronRight,
  Sun,
  Moon,
  MonitorCog,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDisclosure } from '@mantine/hooks';
import type { TFunction } from 'i18next';

import { setCurrentUser } from '@/store/userSlice';
import { updateSelfUser } from '@/http/user';
import { ThemeSwitcher } from '@/shared/ui/ThemeSwitcher';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { useTheme } from '@/shared/hooks/useTheme';
import { handleApiError } from '@/shared/utils/handleApiError';
import { buildAlertProps } from '@/shared/utils/alertPresets';
import { USER_THEMES, type UserTheme } from '@/shared/constants/user-theme';
import type { SelfUserDto } from '@/types/user';

import styles from '../ProfilePage.module.scss';

type Props = {
  user: SelfUserDto;
  onPreferencesSaved: (user: SelfUserDto) => void;
};

type PreferenceRowProps = {
  icon: React.ReactNode;
  label: string;
  isOutdated: boolean;
  control: React.ReactNode;
  t: TFunction;
};

const THEME_ICON_MAP: Record<UserTheme, React.ReactNode> = {
  [USER_THEMES.LIGHT]: <Sun size={18} />,
  [USER_THEMES.DARK]: <Moon size={18} />,
  [USER_THEMES.SYSTEM]: <MonitorCog size={18} />,
};

const PreferenceRow = ({
  icon,
  label,
  isOutdated,
  control,
  t,
}: PreferenceRowProps) => {
  const [opened, { close, open }] = useDisclosure(false);
  return (
    <Badge
      fullWidth
      radius="md"
      variant="light"
      className={styles.contactBadge}
    >
      <Group gap="sm" wrap="nowrap">
        {/* LABEL */}
        <Group gap={6} className={styles.contactLabel} wrap="nowrap">
          {icon}
          <Text size="sm" fw={500}>
            {label}
          </Text>
        </Group>

        <Divider orientation="vertical" />

        {/* VALUE */}
        <Group gap="xs" wrap="nowrap" className={styles.contactValue}>
          {control}

          {isOutdated && (
            <Popover width={260} position="top" withArrow opened={opened}>
              <Popover.Target>
                <Info
                  size={20}
                  color="red"
                  onMouseEnter={open}
                  onMouseLeave={close}
                  style={{ cursor: 'pointer' }}
                />
              </Popover.Target>

              <Popover.Dropdown style={{ pointerEvents: 'none' }}>
                <Text size="sm">{t('profile.settingMissmatch')}</Text>
              </Popover.Dropdown>
            </Popover>
          )}
        </Group>
      </Group>
    </Badge>
  );
};

export const ProfilePreferencesBlock = ({
  user,
  onPreferencesSaved,
}: Props) => {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useTheme();
  const dispatch = useDispatch();

  const [confirmOpened, setConfirmOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState<React.ReactNode | null>(
    null,
  );

  const localLanguage = i18n.language;

  const localTheme =
    colorScheme === 'light'
      ? USER_THEMES.LIGHT
      : colorScheme === 'dark'
        ? USER_THEMES.DARK
        : USER_THEMES.SYSTEM;

  const isLanguageOutdated = localLanguage !== user.language;
  const isThemeOutdated = localTheme !== user.theme;

  const hasOutdated = isLanguageOutdated || isThemeOutdated;

  const handleSavePreferences = async () => {
    setLoading(true);

    try {
      const payload: Record<string, string> = {};

      if (isThemeOutdated) {
        payload.theme = localTheme;
      }

      if (isLanguageOutdated) {
        payload.language = localLanguage;
      }

      const updatedUser = await updateSelfUser(payload);

      dispatch(setCurrentUser(updatedUser));
      onPreferencesSaved(updatedUser);
      setConfirmOpened(false);
      setSuccessAlert(t('profile.preferencesSavedSuccessfully'));
    } catch (e) {
      handleApiError(e, t);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="xs" className={styles.contactsBlock}>
      {/* LANGUAGE */}
      <PreferenceRow
        icon={<Languages size={14} />}
        label={t('profile.language')}
        isOutdated={isLanguageOutdated}
        control={<LanguageSwitcher />}
        t={t}
      />

      {/* THEME */}
      <PreferenceRow
        icon={<Palette size={14} />}
        label={t('profile.theme')}
        isOutdated={isThemeOutdated}
        control={<ThemeSwitcher />}
        t={t}
      />

      {hasOutdated && (
        <Button
          variant="outline"
          mt="sm"
          onClick={() => setConfirmOpened(true)}
        >
          {t('profile.savePreferences')}
        </Button>
      )}

      <Modal
        opened={confirmOpened}
        onClose={() => setConfirmOpened(false)}
        centered
        title={
          <Text fw={700} size="lg" td="underline">
            {t('profile.confirmSaveTitle')}
          </Text>
        }
      >
        <Stack gap="sm">
          <Text>{t('profile.confirmSaveText')}</Text>

          <Stack gap={6}>
            {isThemeOutdated && (
              <Group wrap="nowrap">
                {/* LABEL */}
                <Text c="dimmed" miw={100} w={'30%'}>
                  {t('profile.theme')}
                </Text>

                {/* ARROW */}
                <Center w={24}>
                  <ChevronRight size={18} />
                </Center>

                {/* VALUE */}
                <Center miw={32} w={'10%'}>
                  {THEME_ICON_MAP[localTheme]}
                </Center>
              </Group>
            )}

            {isLanguageOutdated && (
              <Group wrap="nowrap">
                {/* LABEL */}
                <Text c="dimmed" miw={100} w={'30%'}>
                  {t('profile.language')}
                </Text>

                {/* ARROW */}
                <Center w={24}>
                  <ChevronRight size={18} />
                </Center>

                {/* VALUE */}
                <Text fw={600} miw={32} w={'10%'} ta="center">
                  {localLanguage.toUpperCase()}
                </Text>
              </Group>
            )}
          </Stack>

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={() => setConfirmOpened(false)}
              disabled={loading}
            >
              {t('authRequired.cancel')}
            </Button>

            <Button onClick={handleSavePreferences} loading={loading}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {successAlert && (
        <Alert
          className={styles.alert}
          onClose={() => setSuccessAlert(null)}
          {...buildAlertProps('success', successAlert)}
        />
      )}
    </Stack>
  );
};
