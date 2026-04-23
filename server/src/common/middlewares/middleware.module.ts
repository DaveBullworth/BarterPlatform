import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DeviceMiddleware } from './device.middleware';

@Module({
  providers: [DeviceMiddleware],
  exports: [DeviceMiddleware],
})
export class MiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Глобально подключаем cookie-parser и DeviceMiddleware
    consumer
      .apply(cookieParser(), DeviceMiddleware) // порядок важен: сначала cookie-parser
      .forRoutes('*'); // на все маршруты
  }
}
