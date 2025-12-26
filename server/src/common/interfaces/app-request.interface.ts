import { Request as ExpressRequest } from 'express';
import type { JwtPayload } from './jwt-payload.interface';

// Главный основный интерфейс `req` для запроса
export interface AppRequest extends ExpressRequest {
  user?: JwtPayload;
  cookies: {
    device_id?: string;
    refreshToken?: string;
    [key: string]: string | undefined;
  };
}
