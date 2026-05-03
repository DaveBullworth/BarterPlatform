import type { TFunction } from 'i18next';
import { notify } from '../notify';
import { handleApiError } from './handleApiError';

/**
 * Создаёт обработчик ошибок мутации с поддержкой кастомного ответа на 400.
 * Используется когда сервер возвращает намеренно общий 400 для security
 * (password reset, deactivation), и нам нужно показать конкретное сообщение
 * вместо технического описания ошибки.
 */
export const createMutationErrorHandler = (
  t: TFunction,
  options: {
    badRequestTitle?: string;
    badRequestMessage?: string;
    defaultMessage?: string;
  },
) => {
  return (error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;

    if (status === 400 && options.badRequestMessage) {
      notify({
        title: options.badRequestTitle,
        message: options.badRequestMessage,
        color: 'red',
      });
      return;
    }

    handleApiError(error, t, {
      defaultMessage: options.defaultMessage,
    });
  };
};
