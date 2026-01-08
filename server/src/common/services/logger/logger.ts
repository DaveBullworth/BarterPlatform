import path from 'path';
import fs from 'fs';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Используем scopes для сортировки неошибочных логов по отдельным файлам в зависимости от вызывающего сервиса
interface ScopedLogInfo extends winston.Logform.TransformableInfo {
  scope?: string;
}

const isProd = process.env.NODE_ENV === 'production';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const scopeFilter = (allowedScopes: string[]) =>
  winston.format((info: ScopedLogInfo) => {
    if (!info.scope) return info;
    if (allowedScopes.includes(info.scope)) return info;
    return false;
  })();

export const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf((info) => {
      const { timestamp, level, message, ...meta } = info as {
        timestamp: string;
        level: string;
        message: string;
        [key: string]: any;
      };

      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaString}`;
    }),
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'db-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format: winston.format.combine(
        scopeFilter(['db']),
        winston.format.json(),
      ),
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'redis-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      format: winston.format.combine(
        scopeFilter(['redis']),
        winston.format.json(),
      ),
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format: winston.format.combine(
        scopeFilter(['http']),
        winston.format.json(),
      ),
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: '30d',
      level: 'error',
    }),
    new winston.transports.Console({
      level: isProd ? 'info' : 'debug',
      format: winston.format.simple(),
    }),
  ],
});

export default logger;
