import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisSessionService } from '@/common/services/redis/redis.session';
import type { AuthenticatedRequest } from '@/common/interfaces/auth-request.interface';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly redisSessionService: RedisSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const { sid, sub } = request.user;

    const session = await this.redisSessionService.getSession(sid);

    if (!session) {
      throw new UnauthorizedException('Session expired');
    }

    if (session.userId !== sub) {
      throw new UnauthorizedException('Session mismatch');
    }

    if (!session.active) {
      throw new UnauthorizedException('Session revoked');
    }

    return true;
  }
}
