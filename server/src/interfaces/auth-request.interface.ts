import { Request as ExpressRequest } from 'express';
import type { JwtPayload } from './jwt-payload.interface';

// Интерфейс requests для запросов аутентификации
export interface AuthRequest extends ExpressRequest {
  user: JwtPayload;
  cookies: {
    refreshToken?: string;
  };
}
