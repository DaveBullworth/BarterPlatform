import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
  ApiTooManyRequestsResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { DeactivationService } from './deactivation.service';
import { CurrentUser } from '../auth/user.decorator';
import { Authenticated } from '../auth/auth.decorator';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@ApiTags('Account Deactivation')
@Controller('deactivation')
export class DeactivationController {
  constructor(private readonly deactivationService: DeactivationService) {}

  @Authenticated()
  @Post('request')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Запрос кода для деактивации аккаунта',
    description: `
    Отправляет письмо с 6-значным кодом для деактивации аккаунта.

    Особенности:
    - только для авторизованных пользователей
    - без тела запроса
    - защищён от спама
    - честно сообщает состояние аккаунта
  `,
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        {
          example: { result: 'sent' },
        },
        {
          example: {
            result: 'already_requested',
            waitHours: 0.4,
          },
        },
        {
          example: { result: 'user_not_found' },
        },
        {
          example: { result: 'already_deactivated' },
        },
      ],
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Превышен лимит запросов',
  })
  requestDeactivation(@CurrentUser() user: JwtPayload) {
    const { sub: userId } = user;
    return this.deactivationService.request(userId);
  }

  @Authenticated()
  @Post('confirm')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Подтверждение деактивации аккаунта',
    description: `
      Деактивирует аккаунт по 6-значному коду.

      Особенности:
      - код одноразовый
      - ограничен по времени
      - возвращает 200 только если код корректен
    `,
  })
  @ApiBody({
    schema: {
      example: {
        code: '123456',
      },
    },
  })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Некорректный или истёкший код',
  })
  async confirmDeactivation(
    @Body('code') code: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const { sub: userId } = user;
    await this.deactivationService.confirm(userId, code);
    return { success: true };
  }
}
