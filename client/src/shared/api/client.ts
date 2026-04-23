import axios from 'axios';
import { applyLanguageInterceptor } from './interceptors/language.interceptor';
import { applyAuthInterceptor } from './interceptors/auth.interceptor';
import { applyCacheInterceptor } from './interceptors/cache.interceptor';
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

// Порядок важен: language → auth → cache → rateLimit
applyLanguageInterceptor($host);
applyLanguageInterceptor($authHost);
applyAuthInterceptor($authHost, $host);
applyCacheInterceptor($authHost);
applyRateLimitInterceptor($authHost);
