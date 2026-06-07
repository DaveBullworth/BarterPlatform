import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';

import { AppRequest } from '@/common/interfaces/app-request.interface';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

/**
 * Auth для SSE-стрима. Нативный EventSource не умеет слать заголовки, поэтому
 * принимаем токен и из `Authorization: Bearer`, и из `?token=` (для нативного
 * EventSource). HTTPS в проде обязателен, токен короткоживущий.
 */
@Injectable()
export class SseAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      request.user = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      return true;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException('Access token expired');
      }
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractToken(request: AppRequest): string | null {
    const header = request.headers['authorization'];
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }
    const queryToken = request.query?.token;
    return typeof queryToken === 'string' && queryToken ? queryToken : null;
  }
}
