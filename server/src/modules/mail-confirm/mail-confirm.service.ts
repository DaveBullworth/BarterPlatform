import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { EmailConfirmationEntity } from '@/database/entities/email_confirmations.entity';
import { UserEntity } from '@/database/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { EmailConfirmationRateLimitException } from './email-rate-limit.exception';

@Injectable()
export class MailConfirmService {
  constructor(
    // Репозиторий для хранения токенов подтверждения
    @InjectRepository(EmailConfirmationEntity)
    private readonly emailConfirmRepo: Repository<EmailConfirmationEntity>,

    // Сервис отправки писем
    private readonly mailService: MailService,

    // Для доступа к конфигу приложения (например, базовый URL)
    private readonly configService: ConfigService,
  ) {}

  /**
   * Генерирует уникальный токен подтверждения почты, сохраняет его в БД и отправляет письмо пользователю
   * @param user - пользователь, которому нужно отправить подтверждение
   */
  async createAndSendToken(user: UserEntity) {
    // 🔹 Генерация случайного токена 32 байта в hex
    const token = crypto.randomBytes(32).toString('hex');

    // 🔹 Время жизни токена — 24 часа
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 🔹 Создаём запись в БД
    const emailToken = this.emailConfirmRepo.create({
      token,
      user,
      expiresAt,
    });
    await this.emailConfirmRepo.save(emailToken);

    // 🔹 Формируем ссылку подтверждения динамически через конфиг
    // Вместо захардкода используем BASE_URL из env
    const baseUrl =
      this.configService.get<string>('BASE_URL') ?? 'http://localhost:3000';
    const confirmUrl = `${baseUrl}/mail-confirm/confirm-email?token=${token}`;

    // 🔹 Отправляем письмо пользователю через MailService
    await this.mailService.sendEmailConfirmation(
      user.email,
      user.language,
      confirmUrl,
    );
  }

  /* Подтверждает email по токену */
  async confirmEmail(token: string) {
    const entity = await this.emailConfirmRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!entity) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (entity.expiresAt < new Date()) {
      await this.emailConfirmRepo.remove(entity); // удаляем просроченный токен
      throw new BadRequestException('Token has expired');
    }

    // Активируем почту пользователя
    entity.user.statusEmail = true;
    await this.emailConfirmRepo.manager.save(entity.user);

    // Удаляем использованный токен
    await this.emailConfirmRepo.remove(entity);

    return { message: 'Email confirmed successfully' };
  }

  /* Отправляем токен повторно */
  async resendToken(user: UserEntity) {
    // ищем последний токен для пользователя, который ещё не истёк
    const lastToken = await this.emailConfirmRepo.findOne({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();

    if (lastToken && lastToken.expiresAt > now) {
      // проверяем лимит времени (например, 1 час с момента создания токена)
      const diffMs = now.getTime() - lastToken.createdAt.getTime();
      const diffHours = diffMs / 1000 / 60 / 60;
      if (diffHours < 1) {
        throw new EmailConfirmationRateLimitException(1 - diffHours);
      }
    }

    // можно отправлять новый токен
    await this.createAndSendToken(user);

    return { message: 'New confirmation email sent' };
  }
}
