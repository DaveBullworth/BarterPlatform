import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Repository, Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { notificationBuilders } from '../notifications/notification.builders';
import { SessionPolicyService } from './policies/session-policy.service';
import { LoginBruteforcePolicy } from './policies/login-bruteforce.policy';
import { UserEntity } from '../../database/entities/user.entity';
import { SessionEntity } from '../../database/entities/session.entity';
import { AuthErrorCode } from './errors/auth-error-codes';
import { RedisSessionService } from '@/common/services/redis/redis.session';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

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
    private readonly redisSessionService: RedisSessionService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
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

    // пользователь деактивирован
    if (!user.status) {
      // НЕ регистрируем brute-force фейл и НЕ сбрасываем счётчик
      throw new ForbiddenException({
        code: AuthErrorCode.USER_DEACTIVATED,
      });
    }

    // БРУТФОРС - успех → сбрасываем счётчик
    await this.loginBruteforcePolicy.reset({ deviceId, ip });

    // Гасим протухшие сессии, чтобы они не занимали лимит и не мешали
    // переиспользованию сессии этого устройства.
    await this.sessionPolicy.cleanupExpired(user.id);

    // ===== ИЩЕМ СУЩЕСТВУЮ СЕССИЮ С ЭТОГО УСТРОЙСТВА =====
    const existingSession = await this.sessionRepo.findOne({
      where: {
        user: { id: user.id },
        status: true,
        deviceId,
        userAgent,
      },
    });

    // Создаём сессию ПЕРЕД токенами
    const sessionDuration = remember
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000; // ms

    // ===== ПЕРЕИСПОЛЬЗОВАНИЕ =====
    if (existingSession) {
      existingSession.expiresAt = new Date(Date.now() + sessionDuration);
      existingSession.lastSeenAt = new Date();

      const accessToken = this.generateAccessToken(user, existingSession.id);
      const refreshToken = this.generateRefreshToken(
        user,
        existingSession.id,
        remember,
      );

      existingSession.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await this.sessionRepo.save(existingSession);

      await this.redisSessionService.setSession(
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
    // Освобождаем место под новую сессию: чистим протухшие и при необходимости
    // вытесняем самую старую активную (скользящее окно — вход доступен всегда).
    await this.sessionPolicy.enforceSessionLimit(user.id);

    // Знакомое ли устройство: есть ли у пользователя прошлые сессии с этим
    // deviceId (любого статуса). Нужно, чтобы НЕ слать уведомление о входе при
    // обычном повторном логине (logout деактивирует сессию, а не удаляет).
    const isKnownDevice = deviceId
      ? (await this.sessionRepo.count({
          where: { user: { id: user.id }, deviceId },
        })) > 0
      : false;

    const session = this.sessionRepo.create({
      user,
      ip,
      userAgent,
      deviceId,
      expiresAt: new Date(Date.now() + sessionDuration),
      lastSeenAt: new Date(),
      status: true,
    });

    await this.sessionRepo.save(session);

    const accessToken = this.generateAccessToken(user, session.id);
    const refreshToken = this.generateRefreshToken(user, session.id, remember);

    session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.sessionRepo.save(session);

    await this.redisSessionService.setSession(
      session.id,
      {
        userId: user.id,
        active: true,
        expiresAt: session.expiresAt.getTime(),
      },
      30 * 24 * 60 * 60,
    );

    // Уведомляем только о входе с НОВОГО устройства, а не при каждом логине.
    if (!isKnownDevice) {
      this.notificationsService.emit(
        notificationBuilders.newLogin({
          userId: user.id,
          ip,
          deviceId,
          userAgent,
        }),
      );
    }

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

      // Обновляем «последнюю активность» — refresh служит естественным
      // heartbeat'ом активной сессии (раз в ~15 мин на живом клиенте).
      session.lastSeenAt = new Date();
      await this.sessionRepo.save(session);

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
        // Единая точка отзыва: status=false + удаление ключа из Redis.
        await this.sessionPolicy.revoke(session);
        return;
      }
    }

    // Если не нашли соответствующую сессию
    throw new UnauthorizedException({
      code: AuthErrorCode.SESSION_NOT_FOUND,
    });
  }
}
