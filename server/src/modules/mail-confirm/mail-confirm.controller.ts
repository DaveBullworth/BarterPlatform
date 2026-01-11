import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { UserEntity } from '@/database/entities/user.entity';
import { MailConfirmService } from './mail-confirm.service';

@ApiTags('Mail Confirm')
@Controller('mail-confirm')
export class MailConfirmController {
  constructor(
    private readonly mailConfirmService: MailConfirmService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * GET /mail-confirm/confirm-email?token=...
   * Проверка и подтверждение email по токену
   */
  @Get('confirm-email')
  @ApiOperation({
    summary: 'Подтверждение email пользователя по токену',
    description: `
      Подтверждает email пользователя по одноразовому токену.

      Используется:
      - при переходе по ссылке из письма
      - токен удаляется после успешного подтверждения
      - просроченный или неверный токен приводит к ошибке
    `,
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Одноразовый токен подтверждения email',
    example: 'a8c2d8b4-7e3a-4d6f-9c3a-8f0b9c1e2d34',
  })
  @ApiOkResponse({
    description: 'Email успешно подтверждён',
    schema: {
      example: {
        message: 'Email confirmed successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Неверный или просроченный токен или почта уже подтверждена',
    schema: {
      oneOf: [
        { example: { message: 'Invalid or expired token' } },
        { example: { message: 'Token has expired' } },
        { example: { message: 'Email is already confirmed' } },
      ],
    },
  })
  async confirmEmail(@Query('token') token: string) {
    return this.mailConfirmService.confirmEmail(token);
  }

  /**
   * POST /mail-confirm/resend
   * Повторная отправка письма подтверждения почты
   */
  @Post('resend')
  @ApiOperation({
    summary: 'Повторная отправка письма подтверждения email',
    description: `
    Отправляет письмо с подтверждением email повторно.

    Особенности:
    - пользователь ищется по email или login
    - если email уже подтверждён — письмо не отправляется
    - действует лимит повторной отправки (1 час)
    `,
  })
  @ApiBody({
    description:
      'Email или логин пользователя, для которого нужно повторно отправить письмо подтверждения',
    required: true,
    schema: {
      type: 'object',
      properties: {
        loginOrEmail: { type: 'string', example: 'user@example.com' },
      },
      required: ['loginOrEmail'],
    },
  })
  @ApiOkResponse({
    description: 'Письмо подтверждения успешно отправлено',
    schema: {
      example: { message: 'New confirmation email sent' },
    },
  })
  @ApiConflictResponse({
    description: 'Email уже подтверждён',
    schema: {
      example: { message: 'Email already confirmed' },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Превышен лимит повторной отправки',
    schema: {
      example: {
        message: 'You can request a new confirmation email in 1 hour(s)',
        waitHours: 0.7,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Пользователь не найден',
    schema: {
      example: { message: 'User not found' },
    },
  })
  async resend(@Body() body: { loginOrEmail: string }) {
    // ищем пользователя по email или login
    const user = await this.userRepo.findOne({
      where: [{ email: body.loginOrEmail }, { login: body.loginOrEmail }],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.statusEmail) {
      throw new ConflictException('Email already confirmed');
    }

    // вызываем сервис для повторной отправки токена
    return this.mailConfirmService.resendToken(user);
  }
}
