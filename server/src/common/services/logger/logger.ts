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

// Фильтр по scope
const scopeFilter = (allowedScopes: string[]) =>
  winston.format((info: ScopedLogInfo) => {
    // Пропускаем только сообщения с нужным scope
    if (info.scope && allowedScopes.includes(info.scope)) return info;
    return false;
  })();

// Универсальный формат логов с timestamp
const logFormat = winston.format.printf((info: ScopedLogInfo) => {
  const { timestamp, level, message, ...meta } = info as {
    timestamp: string;
    level: string;
    message: string;
    [key: string]: any;
  };
  const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaString}`;
});

export const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  ),
  transports: [
    // DB
    new DailyRotateFile({
      filename: path.join(logDir, 'db-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format: winston.format.combine(scopeFilter(['db']), logFormat),
    }),

    // Redis
    new DailyRotateFile({
      filename: path.join(logDir, 'redis-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      format: winston.format.combine(scopeFilter(['redis']), logFormat),
    }),

    // HTTP
    new DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format: winston.format.combine(scopeFilter(['http']), logFormat),
    }),

    // Error
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: '30d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        logFormat,
      ),
    }),

    // Console
    new winston.transports.Console({
      level: isProd ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        logFormat,
      ),
    }),
  ],
});

export default logger;
