import type { AxiosInstance, AxiosError } from 'axios';
import { store } from '@/app/store';
import { logout } from '@/app/store/userSlice';
import type { RetryableAxiosConfig } from '../types';

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
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${data.accessToken}`,
        };
        return authInstance(original);
      } catch {
        store.dispatch(logout());
        return Promise.reject(error);
      }
    },
  );
};
