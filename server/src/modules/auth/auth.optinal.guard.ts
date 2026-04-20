import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenExpiredError } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { AppRequest } from '@/common/interfaces/app-request.interface';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const authHeader = request.headers['authorization'];

    // нет токена — просто идём дальше
    if (!authHeader || typeof authHeader !== 'string') {
      return true;
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
