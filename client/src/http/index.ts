import axios, { type AxiosRequestConfig, AxiosError } from 'axios';
import { store } from '@/store/index';
import { rateLimitHit } from '@/store/appSlice';
import { logout } from '@/store/userSlice';
import { USER_LANGUAGES } from '../shared/constants/user-language';

const API_URL = import.meta.env.VITE_API_URL;

// Разные флаги для разных Интерцепторов ответов
/*
  1. Для повтора запроса после успешного обновления `accessToken`
  2. Для повтора запроса после неудачной проверки валидности кеша записи
*/
type RetryableAxiosConfig = AxiosRequestConfig & {
  _retryAuth?: boolean;
  _retryCache?: boolean;
};

// -------------------- Axios экземпляры --------------------

// Публичные запросы
const $host = axios.create({
  baseURL: API_URL,
  withCredentials: true, // для получения device_id из куки
});

// Авторизованные запросы
const $authHost = axios.create({
  baseURL: API_URL,
  withCredentials: true, // важно, чтобы refresh cookie отправлялась
});

// -------------------- Интерцепторы запросов --------------------

// Неавторизованный хост
$host.interceptors.request.use((config) => {
  const lng = localStorage.getItem('lng') || USER_LANGUAGES.EN;

  // Если AxiosHeaders, используем set
  if ('set' in config.headers) {
    config.headers.set('Accept-Language', lng);
  } else {
    // Иначе обычное присваивание ключа
    (config.headers as Record<string, string>)['Accept-Language'] = lng;
  }

  return config;
});

// Авторизованный хост
$authHost.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  const lng = localStorage.getItem('lng') || USER_LANGUAGES.EN;

  if ('set' in config.headers) {
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    config.headers.set('Accept-Language', lng);
  } else {
    const headers = config.headers as Record<string, string>;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    headers['Accept-Language'] = lng;
  }

  return config;
});

// -------------------- Интерцептор ответов --------------------

// УСТАРЕЛ ТОКЕН
$authHost.interceptors.response.use(
  (res) => res,
  async (error: AxiosError & { config?: RetryableAxiosConfig }) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retryAuth
    ) {
      originalRequest._retryAuth = true;

      try {
        // refresh отправляется автоматически с cookie
        const { data } = await $host.post('/auth/refresh');

        // Новый access token
        localStorage.setItem('accessToken', data.accessToken);

        // Повторяем исходный запрос
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }

        return $authHost(originalRequest);
      } catch (err) {
        store.dispatch(logout());
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

// УСТАРЕЛ КЕШ
$authHost.interceptors.response.use(
  (res) => res,
  async (error: AxiosError & { config?: RetryableAxiosConfig }) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 412 &&
      originalRequest &&
      !originalRequest._retryCache
    ) {
      originalRequest._retryCache = true;

      if (originalRequest.headers) {
        delete originalRequest.headers['If-User-Updated-Since'];
      }

      return $authHost(originalRequest);
    }

    return Promise.reject(error);
  },
);

// ПРЕВЫШЕН ЛИМИТ ЗАПРОСОВ
$authHost.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 429) {
      const retryAfter = Number(error.response.headers['retry-after']) || 5;

      store.dispatch(rateLimitHit(retryAfter));

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

// -------------------- Экспорт --------------------

export { $host, $authHost };
