import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Authenticated } from '../auth/auth.decorator';
import { CurrentUser } from '../auth/user.decorator';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { UpsertUserPreferencesDto } from './dto/upsert-preferences.dto';
import {
  UserPreferenceResponseDto,
  UserPreferencesListResponseDto,
} from './dto/preference-response.dto';
import { PreferenceAvailabilityDto } from './dto/preference-availability.dto';
import { UserPreferenceErrorCode } from './errors/user-preferences-error-codes';
import { UserPreferencesService } from './user-preferences.service';

@ApiBearerAuth()
@ApiTags('UserPreferences')
@Authenticated()
@Controller('user-preferences')
export class UserPreferencesController {
  constructor(
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Получить предпочтения текущего пользователя',
    description:
      'Возвращает плоский массив записей { targetType, targetId, weight }. Веса 1..3.',
  })
  @ApiOkResponse({ type: UserPreferencesListResponseDto })
  @ApiForbiddenResponse({ description: 'Пользователь не авторизован' })
  @ApiInternalServerErrorResponse({ description: 'Внутренняя ошибка сервера' })
  async getMy(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserPreferencesListResponseDto> {
    const items = await this.userPreferencesService.getByUser(user.sub);
    return { items: items as UserPreferenceResponseDto[] };
  }

  @Put('me')
  @ApiOperation({
    summary: 'Полностью заменить предпочтения текущего пользователя',
    description:
      'Replace-семантика: пустой массив эквивалентен сбросу. Дубликаты целевых пар запрещены.',
  })
  @ApiOkResponse({ type: UserPreferencesListResponseDto })
  @ApiBadRequestResponse({
    description: 'Невалидный target или дубликаты',
    schema: {
      example: {
        code: UserPreferenceErrorCode.INVALID_TARGET,
        message: 'Unknown taxonomy target: subcategory:9999',
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Пользователь не авторизован' })
  @ApiInternalServerErrorResponse({ description: 'Внутренняя ошибка сервера' })
  async replaceMy(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertUserPreferencesDto,
  ): Promise<UserPreferencesListResponseDto> {
    const items = await this.userPreferencesService.replaceAll(
      user.sub,
      dto.items,
    );
    return { items: items as UserPreferenceResponseDto[] };
  }

  @Delete('me')
  @ApiOperation({
    summary: 'Сбросить все предпочтения текущего пользователя',
  })
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiForbiddenResponse({ description: 'Пользователь не авторизован' })
  resetMy(@CurrentUser() user: JwtPayload) {
    return this.userPreferencesService.reset(user.sub);
  }

  @Post('me/select-all')
  @ApiOperation({
    summary: 'Выбрать все доступные узлы таксономии (weight=1)',
    description:
      'Все главы/категории/подкатегории получают вес 1. Удобная стартовая точка.',
  })
  @ApiOkResponse({ type: UserPreferencesListResponseDto })
  @ApiForbiddenResponse({ description: 'Пользователь не авторизован' })
  @ApiInternalServerErrorResponse({ description: 'Внутренняя ошибка сервера' })
  async selectAllMy(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserPreferencesListResponseDto> {
    const items = await this.userPreferencesService.selectAll(user.sub);
    return { items: items as UserPreferenceResponseDto[] };
  }

  @Get(':userId/availability')
  @ApiOperation({
    summary: 'Маскированные предпочтения чужого пользователя',
    description:
      'Возвращает только МНОЖЕСТВА id категорий, которые интересны пользователю (true/false без весов). Используется при выборе своих лотов для предложения обмена.',
  })
  @ApiOkResponse({ type: PreferenceAvailabilityDto })
  @ApiForbiddenResponse({ description: 'Пользователь не авторизован' })
  @ApiInternalServerErrorResponse({ description: 'Внутренняя ошибка сервера' })
  async getAvailability(
    @Param('userId') userId: string,
  ): Promise<PreferenceAvailabilityDto> {
    return this.userPreferencesService.getAvailabilityForUser(userId);
  }
}
