import { useEffect, useState, useRef, useCallback } from 'react';
import { Title, Stack, Loader, Center, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import type { AxiosError } from 'axios';

import { getSelfUser } from '@/http/user';
import type { SelfUserDto } from '@/types/user';
import { ProfileHeaderBlock } from './components/ProfileHeaderBlock';
import { ProfileContactsBlock } from './components/ProfileContactsBlock';
import { ProfilePreferencesBlock } from './components/ProfilePreferencesBlock';
import { AccountDeactivationModal } from './components/AccountDeactivationModal';
import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';
import { setUser } from '@/store/userSlice';
import type { RootState } from '@/store';
import type { ApiErrorData } from '@/types/error';

export const ProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const cachedUser = useSelector((state: RootState) => state.user);

  const [user, setUserState] = useState<SelfUserDto | null>(
    cachedUser.isAuthenticated ? (cachedUser as SelfUserDto) : null,
  );
  const [loading, setLoading] = useState(!cachedUser.isAuthenticated);
  const [deactivationModalOpened, setDeactivationModalOpened] = useState(false);

  const cachedUserRef = useRef(cachedUser);

  const handleUserUpdated = (updatedUser: SelfUserDto) => {
    setUserState(updatedUser);
  };

  // Загружаем данные с сервера
  const fetchUser = useCallback(async () => {
    try {
      const selfUser = await getSelfUser(cachedUserRef.current.updatedAt);

      // Обновляем Redux и локальный state
      dispatch(
        setUser({
          ...selfUser,
          updatedAt: selfUser.updatedAt ?? new Date().toISOString(),
        }),
      );
      setUserState(selfUser);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiErrorData>;

      if (axiosError.response?.status) {
        const status = axiosError.response.status;

        // 400 — общий ответ безопасности
        if (status === 400) {
          notify({
            title: t('deactivation.errorTitle'),
            message: t('deactivation.errorMessage'),
            color: 'red',
          });
        } else {
          // остальные — технические
          handleApiError(err, t, {
            defaultMessage: t('deactivation.failed'),
          });
        }
      } else {
        handleApiError(err, t, { defaultMessage: t('deactivation.failed') });
      }
    } finally {
      setLoading(false);
    }
  }, [dispatch, t]); // ESLint будет доволен

  useEffect(() => {
    // Если нет кеша, загружаем
    if (!cachedUserRef.current.isAuthenticated) {
      fetchUser();
    } else {
      // кеш есть — рендерим сразу
      setLoading(false);

      // но всё равно проверяем актуальность
      fetchUser();
    }
  }, [fetchUser]);

  if (loading) {
    return (
      <Center w={'100%'}>
        <Loader />
      </Center>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Stack gap="lg" w={'100%'}>
      <Title order={2}>{t('profile.title')}</Title>

      <ProfileHeaderBlock user={user} />
      <ProfileContactsBlock user={user} />
      <ProfilePreferencesBlock
        user={user}
        onPreferencesSaved={handleUserUpdated}
      />

      {/* Кнопка для открытия модалки */}
      <Button
        color="red"
        onClick={() => setDeactivationModalOpened(true)}
        maw={600}
      >
        {t('deactivation.deactivate')}
      </Button>

      {/* Модалка */}
      <AccountDeactivationModal
        opened={deactivationModalOpened}
        onClose={() => setDeactivationModalOpened(false)}
      />
    </Stack>
  );
};
