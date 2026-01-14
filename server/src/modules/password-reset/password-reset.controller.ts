import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiBadRequestResponse,
  ApiBody,
  getSchemaPath,
} from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetRequestDto } from './dto/passwordResetRequestDto';
import { PasswordResetConfirmDto } from './dto/passwordResetConfirmDto';

@ApiTags('Password Reset')
@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('request')
  @ApiOperation({
    summary: 'Запрос на сброс пароля',
    description: `
      Отправляет письмо со ссылкой для сброса пароля.

      Особенности:
      - всегда возвращает 200
      - защищён от брутфорса и спама
      - токен одноразовый и ограничен по времени
    `,
  })
  @ApiBody({
    description:
      'Email пользователя, на которое будет отправленно письмо со ссылкой для сброса пароля',
    required: true,
    schema: {
      $ref: getSchemaPath(PasswordResetRequestDto),
    },
  })
  @ApiOkResponse({
    description: 'Результат запроса',
    schema: {
      oneOf: [
        {
          example: {
            result: 'sent',
          },
        },
        {
          example: {
            result: 'already_requested',
            waitHours: 0.7,
          },
        },
      ],
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Превышен лимит запросов',
  })
  async requestReset(@Body() dto: PasswordResetRequestDto) {
    return await this.passwordResetService.request(dto.email);
  }

  @Post('confirm')
  @ApiOperation({
    summary: 'Подтверждение сброса пароля',
    description: `
      Устанавливает новый пароль по токену из письма.

      Особенности:
      - токен одноразовый
      - проверяется срок действия
      - возвращает 200 даже если токен некорректен
    `,
  })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Некорректный или истёкший токен',
  })
  async confirmReset(@Body() dto: PasswordResetConfirmDto) {
    await this.passwordResetService.confirm(dto.token, dto.newPassword);

    return { success: true };
  }
}
