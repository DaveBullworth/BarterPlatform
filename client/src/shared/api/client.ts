import axios from 'axios';
import { applyLanguageInterceptor } from './interceptors/language.interceptor';
import { applyAuthInterceptor } from './interceptors/auth.interceptor';
import { applyRateLimitInterceptor } from './interceptors/rateLimit.interceptor';

const API_URL = import.meta.env.VITE_API_URL as string;

// Публичные запросы (без токена)
export const $host = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Авторизованные запросы
export const $authHost = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Применяем перехватчики к обоим экземплярам
// Порядок важен: language → auth → rateLimit
applyLanguageInterceptor($host);
applyLanguageInterceptor($authHost);
applyAuthInterceptor($authHost, $host);
applyRateLimitInterceptor($authHost);

// Коллбеки для использования redux actions в перехватчиках
type ApiClientConfig = {
  onRateLimit: (retryAfter: number) => void;
  onLogout: () => void;
};

let clientConfig: ApiClientConfig = {
  onRateLimit: () => {},
  onLogout: () => {},
};

export const configureApiClient = (config: ApiClientConfig): void => {
  clientConfig = config;
};

export const getApiClientConfig = (): ApiClientConfig => clientConfig;
