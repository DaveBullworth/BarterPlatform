import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class DeviceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
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
    next();
  }
}
