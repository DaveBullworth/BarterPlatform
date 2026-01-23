import type { ErrorTypes } from '../shared/constants/error-types';

export interface ApiErrorData {
  code?: ErrorTypes;
  message?: string;
  meta?: {
    // auth
    maxSessions?: number;
    currentSessions?: number;
    action?: string;
    isBruteforce?: boolean; // новый флаг

    // mail confirm / resend
    loginOrEmail?: string;
    waitHours?: number;
  };
}
