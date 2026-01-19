import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestLogin } from '../interfaces/login-request.interface';

@Injectable()
export class DeviceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // ===== DEVICE ID =====
    if (!req.cookies.device_id) {
      const uuid = randomUUID();
      res.cookie('device_id', uuid, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        // secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 год
      });
      req.cookies.device_id = uuid; // чтобы сразу был доступ в запросе
    }

    // ===== IP NORMALIZATION =====
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress;

    // нормализованное значение
    (req as RequestLogin).clientIp = ip;
    next();
  }
}
