import { Response, NextFunction } from 'express';
import { AppRequest } from '@/common/interfaces/app-request.interface';
import { dbLogger } from './logger.scopes';

export function requestLogger(
  req: AppRequest,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();

  res.on('finish', () => {
    try {
      // Собираем информацию о запросе
      const info = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
        deviceId: req.cookies?.device_id ?? null,
        cookies: { ...req.cookies },
        query: req.query,
        // body можно маскировать или оставлять только ключевые поля
        body: maskSensitive(req.body as Record<string, unknown>),
        headers: {
          authorization: req.headers['authorization'] ? '[MASKED]' : null,
          ...filterHeaders(req.headers),
        },
      };

      dbLogger.info(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${info.durationMs}ms`,
        info,
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        dbLogger.error('Failed to log request', {
          error: err.message,
          stack: err.stack,
        });
      } else {
        dbLogger.error('Failed to log request', { error: String(err) });
      }
    }
  });

  next();
}

// Маскируем чувствительные данные
function maskSensitive(
  body: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!body) return null;
  const clone: Record<string, unknown> = { ...body };
  if ('password' in clone) clone['password'] = '[MASKED]';
  if ('refreshToken' in clone) clone['refreshToken'] = '[MASKED]';
  return clone;
}

// Оставляем только нужные заголовки
function filterHeaders(
  headers: Record<string, unknown>,
): Record<string, unknown> {
  const allowed: string[] = ['content-type', 'accept', 'host', 'origin'];
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in headers) out[key] = headers[key];
  }
  return out;
}
