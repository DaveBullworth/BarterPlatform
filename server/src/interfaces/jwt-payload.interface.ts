// Интерфейс для payload токена
export interface JwtPayload {
  sub: string; // userId
  login: string;
  role: string;
  iat?: number;
  exp?: number;
}
