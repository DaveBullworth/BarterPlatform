import type { AxiosRequestConfig } from 'axios';

export type RetryableAxiosConfig = AxiosRequestConfig & {
  _retryAuth?: boolean;
  _retryCache?: boolean;
};

export type PaginatedResponse<T> = {
  total: number;
  data: T[];
};
