import type { AxiosInstance, AxiosError } from 'axios';
import type { RetryableAxiosConfig } from '../types';
import { getApiClientConfig } from '../client';

export const applyAuthInterceptor = (
  authInstance: AxiosInstance,
  publicInstance: AxiosInstance,
): void => {
  // Запрос — добавляем Bearer token
  authInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  // Ответ — 401, пробуем refresh
  authInstance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError & { config?: RetryableAxiosConfig }) => {
      const original = error.config;

      if (error.response?.status !== 401 || !original || original._retryAuth) {
        return Promise.reject(error);
      }

      original._retryAuth = true;

      try {
        const { data } = await publicInstance.post<{ accessToken: string }>(
          '/auth/refresh',
        );
        localStorage.setItem('accessToken', data.accessToken);
        if (original.headers) {
          original.headers.set('Authorization', `Bearer ${data.accessToken}`);
        }
        return authInstance(original);
      } catch {
        getApiClientConfig().onLogout(); // колбэк вместо прямого импорта
        return Promise.reject(error);
      }
    },
  );
};
