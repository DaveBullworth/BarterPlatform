import { Title, Stack, Loader, Center } from '@mantine/core';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import { getSelfUser } from '@/http/user';
import type { SelfUserDto } from '@/types/user';
import { ProfileHeaderBlock } from './ProfileHeaderBlock';
import { setUser } from '@/store/userSlice';
import type { RootState } from '@/store';

export const ProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const cachedUser = useSelector((state: RootState) => state.user);

  const [user, setUserState] = useState<SelfUserDto | null>(
    cachedUser.isAuthenticated ? (cachedUser as SelfUserDto) : null,
  );
  const [loading, setLoading] = useState(!cachedUser.isAuthenticated);

  const cachedUserRef = useRef(cachedUser);

  useEffect(() => {
    // Загружаем данные с сервера
    const fetchUser = async () => {
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
      } catch (err) {
        console.error('Failed to fetch user', err);
      } finally {
        setLoading(false);
      }
    };

    // Если нет кеша, загружаем
    if (!cachedUserRef.current.isAuthenticated) {
      fetchUser();
    } else {
      // кеш есть — рендерим сразу
      setLoading(false);

      // но всё равно проверяем актуальность
      fetchUser();
    }
  }, [dispatch]);

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
    <Stack gap="lg">
      <Title order={2}>{t('profile.title')}</Title>

      <ProfileHeaderBlock user={user} />
    </Stack>
  );
};
