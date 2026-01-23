import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Repository, Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '@/common/services/redis/redis.service';
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
    private readonly redisService: RedisService,
  ) {}

  // Логин
  async login(
    loginOrEmail: string,
    password: string,
    remember: boolean,
    ip?: string,
    deviceId?: string,
    userAgent?: string,
  ) {
    // БРУТФОРС - проверяем лимит ДО ВСЕГО
    await this.loginBruteforcePolicy.assertCanTry({
      loginOrEmail,
      deviceId,
      ip,
    });

    const user = await this.userRepo.findOne({
      where: [{ email: loginOrEmail }, { login: loginOrEmail }],
    });

    // Не разделяем ошибки в целях безопасности
    if (!user || !(await bcrypt.compare(password, user.password))) {
      // БРУТФОРС - если ошибка — регистрируем фейл
      await this.loginBruteforcePolicy.registerFailure({
        loginOrEmail,
        deviceId,
        ip,
      });

      throw new UnauthorizedException({
        code: AuthErrorCode.INVALID_CREDENTIALS,
      });
    }

    // почта не подтверждена
    if (!user.statusEmail) {
      // НЕ регистрируем brute-force фейл и НЕ сбрасываем счётчик
      throw new ForbiddenException({
        code: AuthErrorCode.EMAIL_NOT_CONFIRMED,
        meta: {
          loginOrEmail,
        },
      });
    }

    // БРУТФОРС - успех → сбрасываем счётчик
    await this.loginBruteforcePolicy.reset({ deviceId, ip });

    // ===== ИЩЕМ СУЩЕСТВУЮ СЕССИЮ С ЭТОГО УСТРОЙСТВА =====
    const existingSession = await this.sessionRepo.findOne({
      where: {
        user: { id: user.id },
        status: true,
        deviceId,
        userAgent,
      },
    });

    // Проверка ограничения по кол-ву одновременных сессий
    await this.sessionPolicy.assertCanCreateSession(user.id);

    // Создаём сессию ПЕРЕД токенами
    const sessionDuration = remember
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000; // ms

    // ===== ПЕРЕИСПОЛЬЗОВАНИЕ =====
    if (existingSession) {
      existingSession.expiresAt = new Date(Date.now() + sessionDuration);

      const accessToken = this.generateAccessToken(user, existingSession.id);
      const refreshToken = this.generateRefreshToken(
        user,
        existingSession.id,
        remember,
      );

      existingSession.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await this.sessionRepo.save(existingSession);

      await this.redisService.setSession(
        existingSession.id,
        {
          userId: user.id,
          active: true,
          expiresAt: existingSession.expiresAt.getTime(),
        },
        30 * 24 * 60 * 60,
      );

      return { accessToken, refreshToken };
    }

    // ===== НОВАЯ СЕССИЯ =====
    await this.sessionPolicy.assertCanCreateSession(user.id);

    const session = this.sessionRepo.create({
      user,
      ip,
      userAgent,
      deviceId,
      expiresAt: new Date(Date.now() + sessionDuration),
      status: true,
    });

    await this.sessionRepo.save(session);

    const accessToken = this.generateAccessToken(user, session.id);
    const refreshToken = this.generateRefreshToken(user, session.id, remember);

    session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.sessionRepo.save(session);

    await this.redisService.setSession(
      session.id,
      {
        userId: user.id,
        active: true,
        expiresAt: session.expiresAt.getTime(),
      },
      30 * 24 * 60 * 60,
    );

    return { accessToken, refreshToken };
  }

  generateAccessToken(user: UserEntity, sessionId: string) {
    return this.jwtService.sign(
      { sub: user.id, sid: sessionId, login: user.login, role: user.role },
      { expiresIn: '15m' },
    );
  }

  generateRefreshToken(user: UserEntity, sessionId: string, remember: boolean) {
    return this.jwtService.sign(
      { sub: user.id, sid: sessionId, login: user.login, role: user.role },
      {
        expiresIn: remember ? '30d' : '1d',
        secret: process.env.REFRESH_TOKEN_SECRET,
      },
    );
  }

  // Обновление access token через refresh token
  async refresh(refreshToken: string, ip?: string, userAgent?: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      const session = await this.sessionRepo.findOne({
        where: {
          id: payload.sid,
          status: true,
          refreshTokenHash: Not(IsNull()),
        },
        relations: ['user'],
      });

      // Если сессия не найдена
      if (!session) {
        throw new UnauthorizedException({
          code: AuthErrorCode.SESSION_NOT_FOUND,
        });
      }

      // Если токен не верный
      // тут исключение так как TS не понимает что мы уже отфильтровали в БД нужные записи
      if (!(await bcrypt.compare(refreshToken, session.refreshTokenHash!))) {
        throw new UnauthorizedException({
          code: AuthErrorCode.REFRESH_TOKEN_INVALID,
        });
      }

      // Сессия принадлежит соответствующему пользователю
      if (session.user.id !== payload.sub) {
        throw new UnauthorizedException({
          code: AuthErrorCode.SESSION_MISMATCH,
        });
      }

      const accessToken = this.generateAccessToken(session.user, session.id);
      const newRefreshToken = this.generateRefreshToken(
        session.user,
        session.id,
        false,
      );

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
      where: {
        user: { id: userId },
        status: true,
        refreshTokenHash: Not(IsNull()),
      },
    });

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(
        refreshToken,
        // тут исключение так как TS не понимает что мы уже отфильтровали в БД нужные записи
        session.refreshTokenHash!,
      );
      if (isMatch) {
        session.status = false;
        // Сохраняем сессию с новым статусом с БД
        await this.sessionRepo.save(session);
        // Удаляем сессию из Redis
        await this.redisService.revokeSession(session.id);
        return;
      }
    }

    // Если не нашли соответствующую сессию
    throw new UnauthorizedException({
      code: AuthErrorCode.SESSION_NOT_FOUND,
    });
  }
}
