import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Not, Repository } from 'typeorm';

import { SessionEntity } from '@/database/entities/session.entity';
import { SessionPolicyService } from '../auth/policies/session-policy.service';
import { AuthErrorCode } from '../auth/errors/auth-error-codes';
import { SessionResponseDto } from './dto/session-response.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    private readonly sessionPolicy: SessionPolicyService,
  ) {}

  /**
   * Активные (живые) сессии пользователя. `currentSessionId` — sid из токена
   * запрашивающего, чтобы пометить «это устройство» (для админа — undefined).
   */
  async listForUser(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionResponseDto[]> {
    // Перед выдачей гасим протухшие — список показывает только реально живые.
    await this.sessionPolicy.cleanupExpired(userId);

    const sessions = await this.sessionRepo.find({
      where: {
        user: { id: userId },
        status: true,
        expiresAt: MoreThan(new Date()),
      },
      order: { lastSeenAt: 'DESC', createdAt: 'DESC' },
    });

    return sessions.map((session) => this.toDto(session, currentSessionId));
  }

  /**
   * Завершает одну сессию пользователя. Бросает 404, если сессия не найдена,
   * не принадлежит пользователю или уже неактивна.
   */
  async terminateForUser(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId }, status: true },
    });

    if (!session) {
      throw new NotFoundException({ code: AuthErrorCode.SESSION_NOT_FOUND });
    }

    await this.sessionPolicy.revoke(session);
  }

  /**
   * Завершает все активные сессии пользователя, кроме указанной (текущей).
   * Если keepSessionId не передан (действие админа) — завершает все.
   * Возвращает количество завершённых сессий.
   */
  async terminateAllForUser(
    userId: string,
    keepSessionId?: string,
  ): Promise<{ terminated: number }> {
    const sessions = await this.sessionRepo.find({
      where: {
        user: { id: userId },
        status: true,
        ...(keepSessionId ? { id: Not(keepSessionId) } : {}),
      },
    });

    for (const session of sessions) {
      await this.sessionPolicy.revoke(session);
    }

    return { terminated: sessions.length };
  }

  private toDto(
    session: SessionEntity,
    currentSessionId?: string,
  ): SessionResponseDto {
    return {
      id: session.id,
      ip: session.ip,
      userAgent: session.userAgent,
      deviceId: session.deviceId,
      createdAt: session.createdAt,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
      current: session.id === currentSessionId,
    };
  }
}
