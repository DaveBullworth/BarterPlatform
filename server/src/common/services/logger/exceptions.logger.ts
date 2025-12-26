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

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = extractMessage(exception);

    const stack =
      typeof exception === 'object' &&
      exception !== null &&
      'stack' in exception &&
      typeof (exception as { stack?: unknown }).stack === 'string'
        ? (exception as { stack: string }).stack
        : undefined;

    logger.error(
      `${req.method} ${req.url} ${status} -- ${message}`,
      stack ? { stack } : undefined,
    );

    res.status(status).json({
      statusCode: status,
      message,
    });
  }
}

function extractMessage(exception: unknown): string {
  if (exception instanceof Error) {
    return exception.message;
  }

  if (typeof exception === 'string') {
    return exception;
  }

  if (hasMessage(exception) && typeof exception.message === 'string') {
    return exception.message;
  }

  return 'Unknown error';
}

function hasMessage(value: unknown): value is { message: unknown } {
  return typeof value === 'object' && value !== null && 'message' in value;
}
