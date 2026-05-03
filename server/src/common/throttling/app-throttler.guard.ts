import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AppRequest } from '@/common/interfaces/app-request.interface';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const typedReq = req as unknown as AppRequest & { ip?: string };
    return Promise.resolve(
      typedReq.cookies?.device_id ?? typedReq.ip ?? 'unknown',
    );
  }

  protected generateKey(
    context: ExecutionContext,
    tracker: string,
    throttlerName: string,
  ): string {
    const { req } = this.getRequestResponse(context);
    const typedReq = req as {
      route?: { path?: string };
      originalUrl?: string;
      url?: string;
      method?: string;
    };
    const routeKey =
      typedReq.route?.path ?? typedReq.originalUrl ?? typedReq.url ?? 'unknown';
    const method = typedReq.method ?? 'GET';

    return `${throttlerName}:${method}:${routeKey}:${tracker}`;
  }
}
