import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SessionEntity } from '@/database/entities/session.entity';
import { AuthErrorCode } from '../errors/auth-error-codes';

@Injectable()
export class SessionPolicyService {
  /**
   * Максимальное количество одновременных активных сессий
   * для одного пользователя.
   *
   * ⚠️ Это бизнес-правило, не инфраструктура.
   */
  private readonly MAX_SESSIONS = Number(process.env.MAX_SESSIONS) || 3;

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
  ) {}

  /**
   * Проверяет, может ли пользователь создать новую сессию.
   * Выбрасывает бизнес-ошибку, если лимит превышен.
   */
  async assertCanCreateSession(userId: string): Promise<void> {
    const activeSessionsCount = await this.sessionRepo.count({
      where: {
        user: { id: userId },
        status: true,
      },
    });

    if (activeSessionsCount >= this.MAX_SESSIONS) {
      throw new ForbiddenException({
        code: AuthErrorCode.MAX_SESSIONS_EXCEEDED,
        meta: {
          maxSessions: this.MAX_SESSIONS,
          currentSessions: activeSessionsCount,
          action: 'logout_other_sessions',
        },
      });
    }
  }
}
