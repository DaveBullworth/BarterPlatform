import type { AxiosError } from 'axios';

/**
 * Простая утилита, которая возвращает HTTP-статус код ошибки (если это AxiosError),
 * либо null в остальных случаях.
 */
export const getApiErrorStatusCode = (error: unknown): number | null => {
  if (!error) return null;

  const axiosError = error as AxiosError;

  // Проверяем, что это действительно AxiosError
  if (axiosError.isAxiosError && axiosError.response?.status) {
    return axiosError.response.status;
  }

  return null;
};
