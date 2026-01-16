import axios, { type AxiosRequestConfig, AxiosError } from 'axios';
import { store } from '@/store/index';
import { logout } from '@/store/userSlice';
import { USER_LANGUAGES } from '../shared/constants/user-language';

const API_URL = import.meta.env.VITE_API_URL;

// -------------------- Axios экземпляры --------------------

// Публичные запросы
const $host = axios.create({
  baseURL: API_URL,
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

$authHost.interceptors.response.use(
  (res) => res,
  async (
    error: AxiosError & { config?: AxiosRequestConfig & { _retry?: boolean } },
  ) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

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

// -------------------- Экспорт --------------------

export { $host, $authHost };
