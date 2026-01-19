export interface ApiErrorData {
  code?:
    | 'INVALID_CREDENTIALS'
    | 'EMAIL_NOT_CONFIRMED'
    | 'MAX_SESSIONS_EXCEEDED'
    | 'LOGIN_RATE_LIMIT';
  message?: string;
  meta?: {
    maxSessions?: number;
    currentSessions?: number;
    action?: string;
    isBruteforce?: boolean; // новый флаг
  };
}
