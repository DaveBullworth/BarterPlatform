import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { LoginResponse } from '../interfaces/loginResponse.interface';

@Injectable()
export class RefreshTokenCookieInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<LoginResponse>,
  ): Observable<LoginResponse> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap((data) => {
        if (!data?.refreshToken) return;

        response.cookie('refreshToken', data.refreshToken, {
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        // чтобы refreshToken не утёк в body
        delete data.refreshToken;
      }),
    );
  }
}
