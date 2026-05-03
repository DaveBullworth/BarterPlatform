import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { handleApiError, notify } from '@/shared/lib/';
import {
  userKeys,
  type SelfUser,
  type AdminUser,
  userApi,
} from '@/entities/user';

type UseProfileEditOptions = {
  userId: string;
  isAdminMode: boolean;
  onSuccess: (user: SelfUser | AdminUser) => void;
};

export const useProfileEdit = ({
  userId,
  isAdminMode,
  onSuccess,
}: UseProfileEditOptions) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (dto: Record<string, unknown>) => {
      // dto приходит уже как plain object из buildPayload
      // Конкретный fetcher сам валидирует через Zod внутри
      return isAdminMode
        ? userApi.updateByAdmin(userId, dto)
        : userApi.updateSelf(dto);
    },
    onSuccess: (updatedUser) => {
      // Обновляем кеш точечно
      if (isAdminMode) {
        queryClient.setQueryData(userKeys.byId(userId), updatedUser);
      } else {
        queryClient.setQueryData(userKeys.self(), updatedUser);
      }

      notify({ message: t('profile.dataUpdated'), color: 'green' });
      onSuccess(updatedUser);
    },
    onError: (error) => handleApiError(error, t),
  });

  return {
    save: mutate,
    isPending,
  };
};
