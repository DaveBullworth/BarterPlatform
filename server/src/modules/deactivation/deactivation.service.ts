import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { createHash } from 'crypto';

import { UserEntity } from '@/database/entities/user.entity';
import { AccountDeactivationCodeEntity } from '@/database/entities/account_deactivation_code.entity';
import { MailService } from '@/modules/mail/mail.service';
import { DeactivationPolicy } from './policies/deactivation.policy';
import { DeactivationRequestResult } from './dto/deactivationRequestDto';

@Injectable()
export class DeactivationService {
  // сколько живёт код
  private readonly CODE_TTL_MINUTES = 30;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(AccountDeactivationCodeEntity)
    private readonly codeRepo: Repository<AccountDeactivationCodeEntity>,

    private readonly mailService: MailService,
    private readonly policy: DeactivationPolicy,
  ) {}

  /**
   * Запрос кода деактивации
   */
  async request(userId: string): Promise<{
    result: DeactivationRequestResult;
    waitHours?: number;
  }> {
    // 1. policy (rate-limit)
    await this.policy.assertCanRequest(userId);

    // 2. пользователь (включая деактивированных)
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      return { result: DeactivationRequestResult.USER_NOT_FOUND };
    }

    if (user.status === false) {
      return { result: DeactivationRequestResult.ALREADY_DEACTIVATED };
    }

    // 3. активный код
    const activeCode = await this.codeRepo.findOne({
      where: {
        user: { id: user.id },
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (activeCode) {
      const now = Date.now();
      const expires = activeCode.expiresAt.getTime();
      const waitHours = Number(
        (Math.max(expires - now, 0) / 1000 / 60 / 60).toFixed(2),
      );

      return {
        result: DeactivationRequestResult.ALREADY_REQUESTED,
        waitHours,
      };
    }

    // 4. регистрируем попытку
    await this.policy.registerRequest(userId);

    // 5. код
    const rawCode = this.generateCode();
    const codeHash = this.hashCode(rawCode);

    // 6. сохраняем
    await this.codeRepo.save({
      user,
      codeHash,
      expiresAt: this.expireAt(),
    });

    // 7. письмо
    await this.mailService.sendAccountDeactivationCode(
      user.email,
      user.language,
      rawCode,
    );

    return { result: DeactivationRequestResult.SENT };
  }

  /**
   * Подтверждение деактивации
   */
  async confirm(userId: string, rawCode: string): Promise<void> {
    const codeHash = this.hashCode(rawCode);

    const code = await this.codeRepo.findOne({
      where: {
        codeHash,
        used: false,
        expiresAt: MoreThan(new Date()),
        user: { id: userId },
      },
      relations: ['user'],
    });

    if (!code) {
      throw new BadRequestException('Invalid or expired code');
    }

    // деактивация
    code.user.status = false;
    await this.userRepo.save(code.user);

    // код использован
    code.used = true;
    await this.codeRepo.save(code);
  }

  // ---------------- helpers ----------------

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private expireAt(): Date {
    const date = new Date();
    date.setMinutes(date.getMinutes() + this.CODE_TTL_MINUTES);
    return date;
  }
}
