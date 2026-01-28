import { $authHost, $host } from './index';

/**
 * Загрузка или обновление аватара пользователя
 */
export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await $authHost.post('/media/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

/**
 * Получить URL аватара пользователя
 * Используется напрямую в <Avatar src="..." />
 */
export const getUserAvatarUrl = (userId: string) => {
  return `${$host.defaults.baseURL}/media/avatars/${userId}`;
};

/**
 * Удалить аватар пользователя
 */
export const deleteAvatar = async () => {
  const { data } = await $authHost.delete('/media/avatar');
  return data;
};
