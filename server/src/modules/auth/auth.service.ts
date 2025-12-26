import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionPolicyService } from './policies/session-policy.service';
import { LoginBruteforcePolicy } from './policies/login-bruteforce.policy';
import { UserEntity } from '../../database/entities/user.entity';
import { SessionEntity } from '../../database/entities/session.entity';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { AuthErrorCode } from './errors/auth-error-codes';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    private readonly jwtService: JwtService,
    private readonly sessionPolicy: SessionPolicyService,
    private readonly loginBruteforcePolicy: LoginBruteforcePolicy,
  ) {}

  // Логин
  async login(
    loginOrEmail: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    // БРУТФОРС - проверяем лимит ДО ВСЕГО
    await this.loginBruteforcePolicy.assertCanTry(loginOrEmail);

    const user = await this.userRepo.findOne({
      where: [{ email: loginOrEmail }, { login: loginOrEmail }],
    });

    // Не разделяем ошибки в целях безопасности
    if (!user || !(await bcrypt.compare(password, user.password))) {
      // БРУТФОРС - если ошибка — регистрируем фейл
      await this.loginBruteforcePolicy.registerFailure(loginOrEmail);

      throw new UnauthorizedException({
        code: AuthErrorCode.INVALID_CREDENTIALS,
      });
    }

    // БРУТФОРС - успех → сбрасываем счётчик
    await this.loginBruteforcePolicy.reset(loginOrEmail);

    // Проверка ограничения по кол-ву одновременных сессий
    await this.sessionPolicy.assertCanCreateSession(user.id);

    // Генерация токенов
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Хешируем refreshToken для хранения в сессии
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    const session = this.sessionRepo.create({
      user,
      refreshTokenHash: hashedRefresh,
      ip,
      userAgent,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
      status: true,
    });

    await this.sessionRepo.save(session);

    return { accessToken, refreshToken };
  }

  generateAccessToken(user: UserEntity) {
    return this.jwtService.sign(
      { sub: user.id, login: user.login, role: user.role },
      { expiresIn: '15m' },
    );
  }

  generateRefreshToken(user: UserEntity) {
    return this.jwtService.sign(
      { sub: user.id, login: user.login, role: user.role },
      { expiresIn: '30d', secret: process.env.REFRESH_TOKEN_SECRET },
    );
  }

  // Обновление access token через refresh token
  async refresh(refreshToken: string, ip?: string, userAgent?: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      const session = await this.sessionRepo.findOne({
        where: { user: { id: payload.sub }, status: true },
        relations: ['user'],
      });

      // Если сессия не найдена
      if (!session) {
        throw new UnauthorizedException({
          code: AuthErrorCode.SESSION_NOT_FOUND,
        });
      }

      // Если токен не верный
      if (!(await bcrypt.compare(refreshToken, session.refreshTokenHash))) {
        throw new UnauthorizedException({
          code: AuthErrorCode.REFRESH_TOKEN_INVALID,
        });
      }

      const accessToken = this.generateAccessToken(session.user);
      const newRefreshToken = this.generateRefreshToken(session.user);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.info(ip, userAgent);

      // если это уже наша осознанная ошибка — пробрасываем
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // все остальные ошибки (expired, malformed, etc)
      throw new UnauthorizedException({
        code: AuthErrorCode.REFRESH_TOKEN_INVALID,
      });
    }
  }

  // Выход из системы
  async logout(userId: string, refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: AuthErrorCode.REFRESH_TOKEN_MISSING,
      });
    }

    const sessions = await this.sessionRepo.find({
      where: { user: { id: userId }, status: true },
    });

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash,
      );
      if (isMatch) {
        session.status = false;
        await this.sessionRepo.save(session);
        return;
      }
    }

    // Если не нашли соответствующую сессию
    throw new UnauthorizedException({
      code: AuthErrorCode.SESSION_NOT_FOUND,
    });
  }
}
