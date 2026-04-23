import type { AxiosInstance, AxiosError } from 'axios';
import { store } from '@/app/store';
import { rateLimitHit } from '@/app/store/appSlice';

export const applyRateLimitInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
      if (error.response?.status === 429) {
        const retryAfter = Number(error.response.headers['retry-after']) || 5;
        store.dispatch(rateLimitHit(retryAfter));
      }
      return Promise.reject(error);
    },
  );
};
