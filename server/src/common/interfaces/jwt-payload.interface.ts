import { UserRole } from '@/database/entities/user.entity';

// Интерфейс для payload токена
export interface JwtPayload {
  sub: string; // userId
  sid: string; // sessionId
  login: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
