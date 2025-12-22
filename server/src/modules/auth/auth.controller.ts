import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import type { AuthRequest } from '@/interfaces/auth-request.interface';
import { AuthGuard } from './auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login
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
      message: 'Login successful',
      accessToken: tokens.accessToken,
    };
  }

  // POST /auth/refresh
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
      message: 'Token refreshed',
      accessToken: newTokens.accessToken,
    };
  }

  // POST /auth/logout
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: AuthRequest) {
    if (!req.user || typeof req.user.sub !== 'string') {
      throw new UnauthorizedException();
    }
    const userId: string = req.user?.sub;

    const refreshToken: string | undefined = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    await this.authService.logout(userId, refreshToken);

    return { message: 'Logged out' };
  }
}
