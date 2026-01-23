import {
  Controller,
  Post,
  Body,
  Req,
  UseInterceptors,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { RequestLogin } from '@/common/interfaces/login-request.interface';
import type { AuthenticatedRequest } from '@/common/interfaces/auth-request.interface';
import type { LoginResponse } from './interfaces/loginResponse.interface';
import { Authenticated } from './auth.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthErrorCode } from './errors/auth-error-codes';
import { RefreshTokenCookieInterceptor } from './interceptors/refreshTokenCookie.interceptor';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login
  @ApiOperation({
    summary: 'Логин пользователя',
    description: `
    Аутентификация по логину или email и паролю.

    Возможные ошибки:
    - INVALID_CREDENTIALS — неверный логин или пароль
    - EMAIL_NOT_CONFIRMED — почта не подтверждена
    - MAX_SESSIONS_EXCEEDED — превышен лимит активных сессий
    - LOGIN_RATE_LIMIT — превышен лимит попыток входа
    `,
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Успешный вход',
    schema: {
      example: {
        message: 'Login successful',
        accessToken: 'jwt-access-token',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка валидации входных данных',
    schema: {
      example: {
        statusCode: 400,
        message: ['password must be longer than or equal to 6 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Неверный логин или пароль',
    schema: {
      example: {
        code: 'INVALID_CREDENTIALS',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Почта не подтверждена',
    schema: {
      example: {
        code: 'EMAIL_NOT_CONFIRMED',
        meta: {
          loginOrEmail: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Превышен лимит активных сессий',
    schema: {
      example: {
        code: 'MAX_SESSIONS_EXCEEDED',
        meta: {
          maxSessions: 3,
          currentSessions: 3,
          action: 'logout_other_sessions',
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Слишком много попыток входа',
    schema: {
      example: {
        code: 'LOGIN_RATE_LIMIT',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  @UseInterceptors(RefreshTokenCookieInterceptor)
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() req: RequestLogin,
  ): Promise<LoginResponse> {
    // по умолчанию false, если не передано
    const remember = body.remember ?? false;

    // Явно закрепляем указанный контракт
    const tokens = await this.authService.login(
      body.loginOrEmail,
      body.password,
      remember,
      req.clientIp,
      req.cookies.device_id,
      req.headers['user-agent'],
    );

    // Access token возвращаем в теле ответа
    return {
      // Пока оставим на этапе разработки для удобство тестирования
      message: 'Login successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // POST /auth/refresh
  @ApiOperation({
    summary: 'Обновление access token',
    description: `
    Обновляет access token с помощью refresh token.

    Возможные ошибки:
    - REFRESH_TOKEN_MISSING — refresh token отсутствует в cookie
    - REFRESH_TOKEN_INVALID — токен невалиден, истёк или повреждён
    - SESSION_NOT_FOUND — сессия не найдена или отозвана
    - SESSION_MISMATCH — сессия не соответствующего пользователя
    `,
  })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
    status: 200,
    description: 'Токен успешно обновлён',
    schema: {
      example: {
        message: 'Token refreshed',
        accessToken: 'new-access-token',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Refresh token недействителен, сессия не найдена или не принадлежит ПОЗ',
    schema: {
      oneOf: [
        {
          example: {
            code: 'REFRESH_TOKEN_MISSING',
          },
        },
        {
          example: {
            code: 'REFRESH_TOKEN_INVALID',
          },
        },
        {
          example: {
            code: 'SESSION_NOT_FOUND',
          },
        },
        {
          example: {
            code: 'SESSION_MISMATCH',
          },
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  @UseInterceptors(RefreshTokenCookieInterceptor)
  @Post('refresh')
  async refresh(@Req() req: AuthenticatedRequest): Promise<LoginResponse> {
    const refreshToken: string | undefined = req.cookies?.refreshToken;
    if (!refreshToken)
      throw new UnauthorizedException({
        code: AuthErrorCode.REFRESH_TOKEN_MISSING,
      });
    const newTokens = await this.authService.refresh(
      refreshToken,
      req.ip,
      req.headers['user-agent'],
    );

    // Access token возвращаем в теле ответа
    return {
      // Пока оставим на этапе разработки для удобство тестирования
      message: 'Token refreshed',
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }

  // POST /auth/logout
  @ApiOperation({
    summary: 'Выход пользователя',
    description: `
    Завершает текущую сессию пользователя.

    Требует:
    - Authorization: Bearer <accessToken>
    - refreshToken в HttpOnly cookie

    Возможные ошибки:
    - REFRESH_TOKEN_MISSING — refresh token отсутствует в cookie
    - SESSION_NOT_FOUND — активная сессия не найдена
    `,
  })
  @ApiBearerAuth()
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно вышел из системы',
    schema: {
      example: {
        message: 'Logged out',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Пользователь не авторизован, сессия или токен обновления не найдены',
    schema: {
      oneOf: [
        {
          example: {
            code: 'REFRESH_TOKEN_MISSING',
          },
        },
        {
          example: {
            code: 'SESSION_NOT_FOUND',
          },
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  @Authenticated()
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest) {
    const userId: string = req.user?.sub;

    // передаём токен прямо как есть (может быть undefined)
    const refreshToken: string | undefined = req.cookies?.refreshToken;

    // сервис сам решает, что делать
    await this.authService.logout(userId, refreshToken);

    // Пока оставим на этапе разработки для удобство тестирования
    return { message: 'Logged out' };
  }
}
