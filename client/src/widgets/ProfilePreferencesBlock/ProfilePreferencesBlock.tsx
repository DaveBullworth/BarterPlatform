import { useState } from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Alert,
  Modal,
  ThemeIcon,
} from '@mantine/core';
import { Palette, Languages, ChevronRight, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher, ThemeSwitcher } from '@/shared/ui';
import { buildAlertProps } from '@/shared/lib';
import { usePreferences } from './usePreferences';
import { PreferenceRow } from './PreferenceRow';
import { THEME_ICON_MAP } from '@/shared/constants/theme-icons-map';
import type { SelfUser } from '@/entities/user';

import styles from './ProfilePreferencesBlock.module.scss';

type Props = {
  user: SelfUser;
};

export const ProfilePreferencesBlock = ({ user }: Props) => {
  const { t } = useTranslation();
  const [confirmOpened, setConfirmOpened] = useState(false);

  const {
    localLanguage,
    localTheme,
    isLanguageOutdated,
    isThemeOutdated,
    hasOutdated,
    save,
    isPending,
    isSuccess,
    reset,
  } = usePreferences(user);

  const handleSave = () => {
    save();
    setConfirmOpened(false);
  };

  return (
    <Stack gap="md">
      <div className={styles.preferencesGrid}>
        <PreferenceRow
          icon={<Languages size={18} strokeWidth={2} />}
          label={t('profile.language')}
          isOutdated={isLanguageOutdated}
          control={<LanguageSwitcher />}
        />

        <PreferenceRow
          icon={<Palette size={18} strokeWidth={2} />}
          label={t('profile.theme')}
          isOutdated={isThemeOutdated}
          control={<ThemeSwitcher />}
        />
      </div>

      {hasOutdated && (
        <div className={styles.saveBar}>
          <Text className={styles.saveBarText}>
            {t('profile.settingMissmatch')}
          </Text>
          <Button
            color="accent"
            leftSection={<Save size={16} />}
            onClick={() => setConfirmOpened(true)}
            size="sm"
          >
            {t('profile.savePreferences')}
          </Button>
        </div>
      )}

      <Modal
        opened={confirmOpened}
        onClose={() => setConfirmOpened(false)}
        title={
          <Text fw={700} size="md">
            {t('profile.confirmSaveTitle')}
          </Text>
        }
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('profile.confirmSaveText')}
          </Text>

          <Stack gap={8}>
            {isThemeOutdated && (
              <Group wrap="nowrap" gap="sm">
                <ThemeIcon variant="light" color="barter" size="sm" radius="md">
                  <Palette size={14} />
                </ThemeIcon>
                <Text size="sm" c="dimmed" miw={90}>
                  {t('profile.theme')}
                </Text>
                <ChevronRight size={14} color="var(--mantine-color-dimmed)" />
                <Group gap={4}>{THEME_ICON_MAP[localTheme]}</Group>
              </Group>
            )}

            {isLanguageOutdated && (
              <Group wrap="nowrap" gap="sm">
                <ThemeIcon variant="light" color="barter" size="sm" radius="md">
                  <Languages size={14} />
                </ThemeIcon>
                <Text size="sm" c="dimmed" miw={90}>
                  {t('profile.language')}
                </Text>
                <ChevronRight size={14} color="var(--mantine-color-dimmed)" />
                <Text size="sm" fw={700}>
                  {localLanguage?.toUpperCase()}
                </Text>
              </Group>
            )}
          </Stack>

          <Group justify="flex-end" mt="sm" gap="xs">
            <Button
              variant="default"
              onClick={() => setConfirmOpened(false)}
              disabled={isPending}
            >
              {t('authRequired.cancel')}
            </Button>
            <Button onClick={handleSave} loading={isPending}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {isSuccess && (
        <Alert
          className={styles.alert}
          onClose={reset}
          {...buildAlertProps(
            'success',
            t('profile.preferencesSavedSuccessfully'),
          )}
        />
      )}
    </Stack>
  );
};
