import { z } from 'zod';

// Сессия в том виде, в каком её отдаёт сервер (SessionResponseDto).
// Даты приходят ISO-строками; userAgent парсится на клиенте (см. lib.ts).
export const SessionSchema = z.object({
  id: z.string(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  deviceId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  lastSeenAt: z.iso.datetime().nullable(),
  expiresAt: z.iso.datetime(),
  current: z.boolean(),
});

export type Session = z.infer<typeof SessionSchema>;

export const SessionListSchema = z.array(SessionSchema);
