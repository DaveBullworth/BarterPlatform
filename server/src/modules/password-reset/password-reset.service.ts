import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';

import { UserEntity } from '@/database/entities/user.entity';
import { PasswordResetTokenEntity } from '@/database/entities/password_reset_token.entity';
import { MailService } from '@/modules/mail/mail.service';
import { PasswordResetPolicy } from './policies/password-reset.policy';
import { PasswordResetRequestResult } from './dto/passwordResetRequestDto';

@Injectable()
export class PasswordResetService {
  // сколько живёт ссылка
  private readonly TOKEN_TTL_HOURS = 1;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(PasswordResetTokenEntity)
    private readonly tokenRepo: Repository<PasswordResetTokenEntity>,

    private readonly mailService: MailService,
    private readonly resetPolicy: PasswordResetPolicy,
  ) {}

  /**
   * Запрос на сброс пароля
   * Всегда отрабатывает "успешно" (без утечек информации)
   */
  async request(email: string): Promise<{
    result: PasswordResetRequestResult;
    waitHours?: number;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Redis policy (частота запросов)
    await this.resetPolicy.assertCanRequest(normalizedEmail);

    // 2. ищем пользователя
    const user = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });

    // 3. если пользователя нет — регистрируем попытку и тихо выходим (врём что отправили)
    if (!user) {
      await this.resetPolicy.registerRequest(normalizedEmail);
      return { result: PasswordResetRequestResult.SENT };
    }

    // 4. проверяем активный токен в БД
    const activeToken = await this.tokenRepo.findOne({
      where: {
        user: { id: user.id },
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    // если токен уже есть — не спамим
    if (activeToken) {
      const now = Date.now();
      const expiresAt = activeToken.expiresAt.getTime();

      const waitMs = Math.max(expiresAt - now, 0);
      const waitHours = Number((waitMs / 1000 / 60 / 60).toFixed(2));

      return {
        result: PasswordResetRequestResult.ALREADY_REQUESTED,
        waitHours,
      };
    }

    // 5. регистрируем попытку ТОЛЬКО если реально будем слать письмо
    await this.resetPolicy.registerRequest(normalizedEmail);

    // 6. генерируем токен
    const rawToken = this.generateToken();
    const tokenHash = this.hashToken(rawToken);

    // 7. сохраняем токен
    await this.tokenRepo.save({
      user,
      tokenHash,
      expiresAt: this.expireAt(),
    });

    // 8. формируем ссылку
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    // 9. отправляем письмо
    await this.mailService.sendPasswordReset(
      user.email,
      user.language,
      resetUrl,
    );

    return { result: PasswordResetRequestResult.SENT };
  }

  async confirm(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);

    // 1. ищем валидный токен
    const token = await this.tokenRepo.findOne({
      where: {
        tokenHash,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!token) {
      // намеренно не уточняем причину
      throw new BadRequestException('Invalid or expired token');
    }

    // 2. хешируем новый пароль
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 3. обновляем пароль
    token.user.password = passwordHash;
    await this.userRepo.save(token.user);

    // 4. помечаем токен использованным
    token.used = true;
    await this.tokenRepo.save(token);
  }

  // --------------------
  // helpers
  // --------------------

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private expireAt(): Date {
    const date = new Date();
    date.setHours(date.getHours() + this.TOKEN_TTL_HOURS);
    return date;
  }
}
