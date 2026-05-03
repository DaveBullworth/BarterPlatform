import type { AxiosInstance, AxiosError } from 'axios';
import { getApiClientConfig } from '../client';

export const applyRateLimitInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
      if (error.response?.status === 429) {
        const retryAfter = Number(error.response.headers['retry-after']) || 5;
        getApiClientConfig().onRateLimit(retryAfter); // колбэк вместо прямого импорта
      }
      return Promise.reject(error);
    },
  );
};
