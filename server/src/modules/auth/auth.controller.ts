import { Controller, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from '@/common/interfaces/auth-request.interface';
import { AuthGuard } from './auth.guard';
import { LoginDto } from './dto/login.dto';

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
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(
      body.loginOrEmail,
      body.password,
      req.ip,
      req.headers['user-agent'],
    );

    // Кладём только refreshToken в HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict', // для защиты от CSRF
    });

    // Access token возвращаем в теле ответа
    return {
      // Пока оставим на этапе разработки для удобство тестирования
      message: 'Login successful',
      accessToken: tokens.accessToken,
    };
  }

  // POST /auth/refresh
  @ApiOperation({
    summary: 'Обновление access token',
    description: `
    Обновляет access token с помощью refresh token.

    Возможные ошибки:
    - REFRESH_TOKEN_INVALID — токен невалиден, истёк или повреждён
    - SESSION_NOT_FOUND — сессия не найдена или отозвана
    `,
  })
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Refresh token пользователя',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
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
    status: 400,
    description:
      'Некорректное тело запроса (refreshToken отсутствует или неверного типа)',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token недействителен или сессия не найдена',
    schema: {
      oneOf: [
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
      ],
    },
  })
  @Post('refresh')
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const newTokens = await this.authService.refresh(
      refreshToken,
      req.ip,
      req.headers['user-agent'],
    );

    // Обновляем только refreshToken cookie
    res.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    // Access token возвращаем в теле ответа
    return {
      // Пока оставим на этапе разработки для удобство тестирования
      message: 'Token refreshed',
      accessToken: newTokens.accessToken,
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
  @UseGuards(AuthGuard)
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
