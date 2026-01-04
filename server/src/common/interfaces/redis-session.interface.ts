export interface RedisSession {
  userId: string;
  active: boolean;
  expiresAt: number;
}
