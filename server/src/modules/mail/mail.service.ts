import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import templates from './templates/templates.json';
import { UserLanguage } from '@/database/entities/user.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Отправка письма с подтверждением почты
   * @param email - адрес пользователя
   * @param language - язык пользователя
   * @param confirmUrl - ссылка для подтверждения
   */
  async sendEmailConfirmation(
    email: string,
    language: UserLanguage,
    confirmUrl: string,
  ): Promise<void> {
    // Берём шаблон по языку, если нет — fallback на английский
    const template =
      templates.emailConfirmation[language] ?? templates.emailConfirmation.en;

    // Подставляем ссылку в html
    const html = template.html.replace('{{confirmUrl}}', confirmUrl);

    await this.sendMail({
      to: email,
      subject: template.subject,
      html,
    });
  }

  /**
   * Основной метод отправки письма
   */
  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    // В dev-режиме — логируем письмо в консоль
    // if (process.env.NODE_ENV !== 'production') {
    //   this.logger.log(`📧 DEV MAIL → ${options.to}`);
    //   this.logger.debug(options.html);
    //   return;
    // }

    // В проде — реально отправляем через Nest MailerService
    try {
      await this.mailerService.sendMail({
        from: `"Barter Exchange" <${process.env.EMAIL_USERNAME}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (e) {
      this.logger.error('Email failed', e);
    }
  }

  /**
   * Отправка письма для сброса пароля
   * @param email - адрес пользователя
   * @param language - язык пользователя
   * @param resetUrl - ссылка для сброса пароля
   */
  async sendPasswordReset(
    email: string,
    language: UserLanguage,
    resetUrl: string,
  ): Promise<void> {
    const template =
      templates.passwordReset[language] ?? templates.passwordReset.en;

    const html = template.html.replace('{{resetUrl}}', resetUrl);

    await this.sendMail({
      to: email,
      subject: template.subject,
      html,
    });
  }
}
