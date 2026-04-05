import { $authHost, $host } from './index';

export type UploadMediaResponse = {
  message: string;
};

export type UploadLotImageResponse = {
  message: string;
  imageId: string;
  isPrimary: boolean;
};

export type LotImageDto = {
  imageId: string;
  isPrimary: boolean;
  mimeType: string;
  data: string;
};

export type GetLotImagesResponse = {
  lotId: string;
  images: LotImageDto[];
};

export type LotMainImageDto = {
  lotId: string;
  imageId: string | null;
  mimeType: string | null;
  data: string | null;
};

export type GetLotsMainImagesResponse = {
  items: LotMainImageDto[];
};

/**
 * Загрузка или обновление аватара пользователя
 */
export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await $authHost.post<UploadMediaResponse>(
    '/media/avatar',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return data;
};

/**
 * Загрузка или обновление аватара другого пользователя (admin)
 */
export const adminUploadAvatar = async (userId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await $authHost.post<UploadMediaResponse>(
    '/media/avatar',
    formData,
    {
      params: { userId },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

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
  const { data } = await $authHost.delete<UploadMediaResponse>('/media/avatar');
  return data;
};

/**
 * Удалить аватар другого пользователя (админу)
 */
export const adminDeleteAvatar = async (userId: string) => {
  const { data } = await $authHost.delete<UploadMediaResponse>('/media/avatar', {
    params: { userId },
  });
  return data;
};

/**
 * Загрузить изображение для лота
 */
export const uploadLotImage = async (lotId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await $authHost.post<UploadLotImageResponse>(
    `/media/lots/${lotId}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return data;
};

/**
 * Сделать изображение лота главным
 */
export const setPrimaryLotImage = async (lotId: string, imageId: string) => {
  const { data } = await $authHost.post<UploadMediaResponse>(
    `/media/lots/${lotId}/images/primary`,
    {
      imageId,
    },
  );

  return data;
};

/**
 * URL оригинального изображения лота
 */
export const getLotOriginalImageUrl = (imageId: string) => {
  return `${$host.defaults.baseURL}/media/lots/images/${imageId}/original`;
};

/**
 * Получить все изображения лота (base64)
 */
export const getLotImages = async (lotId: string) => {
  const { data } = await $host.get<GetLotImagesResponse>(`/media/lots/${lotId}/images`);
  return data;
};

/**
 * Получить главные изображения лотов (base64)
 */
export const getLotsMainImages = async (lotIds: string[]) => {
  const { data } = await $host.post<GetLotsMainImagesResponse>(
    '/media/lots/main-images',
    {
      lotIds,
    },
  );

  return data;
};

/**
 * Удалить изображение лота
 */
export const deleteLotImage = async (imageId: string) => {
  const { data } = await $authHost.delete<UploadMediaResponse>(
    `/media/lots/images/${imageId}`,
  );
  return data;
};
