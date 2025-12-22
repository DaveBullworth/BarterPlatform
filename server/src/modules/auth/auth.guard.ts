import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express'; // тип для req
import { TokenExpiredError } from 'jsonwebtoken';
import type { JwtPayload } from '@/interfaces/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    // Привязываем к Request
    const request = context.switchToHttp().getRequest<Request>();

    // Достаём заголовок Authorization
    const authHeader = request.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Authorization header missing');
    }

    // Формат заголовка: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    const token = parts[1];

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      request.user = payload;
      return true;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException('Access token expired'); // клиент поймёт
      }
      throw new UnauthorizedException('Invalid access token'); // ошибка подписи или подделки
    }
  }
}
