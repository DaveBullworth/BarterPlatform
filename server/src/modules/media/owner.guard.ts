import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '@/common/interfaces/auth-request.interface';
import { UserRole } from '@/database/entities/user.entity';

function extractUserId(request: AuthenticatedRequest): string | undefined {
  if (typeof request.query?.userId === 'string') {
    return request.query.userId;
  }

  if (typeof request.params?.userId === 'string') {
    return request.params.userId;
  }

  return undefined;
}

@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    console.log(user);

    if (!user) return false;

    const targetUserId = extractUserId(request);

    // если userId не передан → значит работает со своим ресурсом
    if (!targetUserId) return true;

    // свой ресурс
    if (targetUserId === user.sub) return true;

    // чужой ресурс → только ADMIN
    return user.role === UserRole.ADMIN;
  }
}
