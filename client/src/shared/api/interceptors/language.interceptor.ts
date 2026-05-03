import type { AxiosInstance } from 'axios';
import { USER_LANGUAGES } from '@/shared/constants/user-language';

export const applyLanguageInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.request.use((config) => {
    const lng = localStorage.getItem('lng') ?? USER_LANGUAGES.EN;
    config.headers.set('Accept-Language', lng);
    return config;
  });
};
