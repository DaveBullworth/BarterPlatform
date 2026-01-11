import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import logger from './logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      // Берём оригинальный payload
      const status = exception.getStatus();
      const response = exception.getResponse(); // <-- тут payload из ValidationPipe
      return res.status(status).json(response);
    }

    // Все остальные ошибки
    const status: number = HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    let stack: string | undefined;

    if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
    } else {
      message = 'Unknown error';
    }

    // Логируем только ошибки 500+
    if (status >= 500) {
      logger.error(
        `${req.method} ${req.url} ${status} -- ${message}`,
        stack ? { stack } : undefined,
      );
    }

    res.status(status).json({
      statusCode: status,
      message,
    });
  }
}
