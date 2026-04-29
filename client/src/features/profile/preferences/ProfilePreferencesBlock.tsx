import { useState } from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Center,
  Alert,
  Modal,
} from '@mantine/core';
import { Palette, Languages, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/shared/ui/ThemeSwitcher';
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
    <Stack gap="xs" className={styles.contactsBlock}>
      <PreferenceRow
        icon={<Languages size={14} />}
        label={t('profile.language')}
        isOutdated={isLanguageOutdated}
        control={<LanguageSwitcher />}
      />

      <PreferenceRow
        icon={<Palette size={14} />}
        label={t('profile.theme')}
        isOutdated={isThemeOutdated}
        control={<ThemeSwitcher />}
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
                <Text c="dimmed" miw={100} w="30%">
                  {t('profile.theme')}
                </Text>
                <Center w={24}>
                  <ChevronRight size={18} />
                </Center>
                <Center miw={32} w="10%">
                  {THEME_ICON_MAP[localTheme]}
                </Center>
              </Group>
            )}

            {isLanguageOutdated && (
              <Group wrap="nowrap">
                <Text c="dimmed" miw={100} w="30%">
                  {t('profile.language')}
                </Text>
                <Center w={24}>
                  <ChevronRight size={18} />
                </Center>
                <Text fw={600} miw={32} w="10%" ta="center">
                  {localLanguage.toUpperCase()}
                </Text>
              </Group>
            )}
          </Stack>

          <Group justify="flex-end" mt="md">
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
