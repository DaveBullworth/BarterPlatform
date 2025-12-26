import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DeviceMiddleware } from './device.middleware';
import { RateLimitMiddleware } from './rate-limit.middleware';

@Module({})
export class MiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Глобально подключаем cookie-parser и DeviceMiddleware
    consumer
      .apply(cookieParser(), DeviceMiddleware, RateLimitMiddleware) // порядок важен: сначала cookie-parser
      .forRoutes('*'); // на все маршруты
  }
}
