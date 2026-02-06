import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Title, Stack, Loader, Center, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import { getSelfUser, getUserById } from '@/http/user';
import { ProfileEditModal } from './components/ProfileEditModal';
import { ProfileHeaderBlock } from './components/ProfileHeaderBlock';
import { ProfileContactsBlock } from './components/ProfileContactsBlock';
import { ProfilePreferencesBlock } from './components/ProfilePreferencesBlock';
import { AccountDeactivationModal } from './components/AccountDeactivationModal';
import { handleApiError } from '@/shared/utils/handleApiError';
import {
  selectCurrentUser,
  selectUserById,
  setCurrentUser,
  upsertUser,
} from '@/store/userSlice';
import type { SelfUserDto, AdminUserDto, PublicUserDto } from '@/types/user';
import type { RootState } from '@/store';
import { USER_ROLES } from '@/shared/constants/user-role';

export type Mode = 'self' | 'admin' | 'public';

export const UserProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();

  const currentUser = useSelector((s: RootState) => selectCurrentUser(s));
  const viewedUser = useSelector((s: RootState) => selectUserById(id ?? '')(s));

  const [user, setUser] = useState<
    SelfUserDto | AdminUserDto | PublicUserDto | null
  >(null);
  const [loading, setLoading] = useState(true);

  const [deactivationModalOpened, setDeactivationModalOpened] = useState(false);
  const [editProfileModalOpened, setEditProfileModalOpened] = useState(false);

  // Determine mode with priority: self -> admin -> public
  const mode: Mode = (() => {
    if (!id) return 'public';
    if (currentUser && currentUser.id === id) return 'self';
    if (currentUser && currentUser.role === USER_ROLES.ADMIN) return 'admin';
    return 'public';
  })();

  // initialize from redux cache
  useEffect(() => {
    if (mode === 'self' && currentUser) {
      setUser(currentUser as SelfUserDto);
      setLoading(false);
      return;
    }

    if (viewedUser) {
      setUser(viewedUser as SelfUserDto | AdminUserDto | PublicUserDto);
      setLoading(false);
    }
  }, [mode, currentUser, viewedUser]);

  const handleUserUpdated = (updatedUser: SelfUserDto) => {
    // if self — update current user, otherwise upsert
    if (mode === 'self') {
      dispatch(
        setCurrentUser({
          ...updatedUser,
          updatedAt: updatedUser.updatedAt ?? new Date().toISOString(),
        }),
      );
    } else if (updatedUser.id) {
      dispatch(
        upsertUser({
          ...updatedUser,
          updatedAt: updatedUser.updatedAt ?? new Date().toISOString(),
        }),
      );
    }

    setUser(updatedUser);
  };

  // Загружаем данные с сервера
  const fetchUser = useCallback(async () => {
    if (!id && mode !== 'self') return;
    setLoading(true);
    try {
      if (mode === 'self') {
        const cachedUpdatedAt = currentUser?.updatedAt;
        const result = await getSelfUser(cachedUpdatedAt);

        dispatch(setCurrentUser(result));
        setUser(result);
        return;
      }

      // viewing other user
      const cachedUpdatedAt = viewedUser?.updatedAt;
      const result = await getUserById(id!, cachedUpdatedAt);

      // persist to store
      dispatch(upsertUser(result));

      setUser(result);
    } catch (err: unknown) {
      handleApiError(err, t, {
        defaultMessage: t('profile.error'),
      });
    } finally {
      setLoading(false);
    }
  }, [id, mode, currentUser, viewedUser, dispatch, t]);

  useEffect(() => {
    // Always attempt to fetch/validate on mount and when id changes
    fetchUser();
  }, [fetchUser]);

  // Guards чтобы сразу понимать тип `user` сейчас
  function isSelfUser(
    user: SelfUserDto | AdminUserDto | PublicUserDto,
  ): user is SelfUserDto {
    return 'language' in user && 'theme' in user;
  }

  function isAdminUser(
    user: SelfUserDto | AdminUserDto | PublicUserDto,
  ): user is AdminUserDto {
    return 'email' in user && 'status' in user;
  }

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

      <ProfileHeaderBlock user={user} mode={mode} />
      <ProfileContactsBlock user={user} />

      {isSelfUser(user) && (
        <ProfilePreferencesBlock
          user={user}
          onPreferencesSaved={handleUserUpdated}
        />
      )}

      {/* Кнопка для открытия модалки изменения данных профиля */}
      {(isSelfUser(user) || isAdminUser(user)) && (
        <Button onClick={() => setEditProfileModalOpened(true)} maw={600}>
          {t('profile.editData')}
        </Button>
      )}

      {/* Кнопка для открытия модалки деактивации */}
      {isSelfUser(user) && (
        <Button
          color="red"
          onClick={() => setDeactivationModalOpened(true)}
          maw={600}
        >
          {t('deactivation.deactivate')}
        </Button>
      )}

      {/* Модалка деактивации*/}
      <AccountDeactivationModal
        opened={deactivationModalOpened}
        onClose={() => setDeactivationModalOpened(false)}
      />

      {/* Модалка изменения данных профиля*/}
      {(isSelfUser(user) || isAdminUser(user)) && (
        <ProfileEditModal
          user={user}
          opened={editProfileModalOpened}
          onClose={() => setEditProfileModalOpened(false)}
          onUpdated={handleUserUpdated}
        />
      )}
    </Stack>
  );
};
