import type { AxiosInstance, AxiosError } from 'axios';
import type { RetryableAxiosConfig } from '../types';

export const applyCacheInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError & { config?: RetryableAxiosConfig }) => {
      const original = error.config;

      if (error.response?.status !== 412 || !original || original._retryCache) {
        return Promise.reject(error);
      }

      original._retryCache = true;
      delete original.headers?.['If-User-Updated-Since'];
      return instance(original);
    },
  );
};
