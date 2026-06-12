import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Authenticated } from '../auth/auth.decorator';
import { CurrentUser } from '../auth/user.decorator';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { GetOffersQueryDto } from './dto/get-offers-query.dto';
import { OfferResponseDto } from './dto/offer-response.dto';
import { OffersFeedResponseDto } from './dto/offer-feed.dto';
import { OfferDetailDto } from './dto/offer-detail.dto';
import { PreferenceAvailabilityDto } from '../user-preferences/dto/preference-availability.dto';
import { UserRole } from '@/database/entities/user.entity';

@ApiBearerAuth()
@ApiTags('Offers')
@Authenticated()
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать предложение обмена',
    description:
      'Предлагает от 1 до 5 своих активных лотов в обмен на чужой лот. Сервер проверяет владение лотами и попадание в предпочтения получателя.',
  })
  @ApiOkResponse({ type: OfferResponseDto })
  @ApiBadRequestResponse({ description: 'Невалидные лоты / вне предпочтений' })
  @ApiConflictResponse({ description: 'Активное предложение уже существует' })
  @ApiNotFoundResponse({ description: 'Целевой лот не найден' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOfferDto,
  ): Promise<OfferResponseDto> {
    return this.offersService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Лента предложений (входящие/исходящие) с пагинацией и фильтрами',
    description:
      'role — отправленные/полученные; statuses[] — фильтр по статусам; page/limit — пагинация; сортировка по дате изменения. asUserId доступен только ADMIN — просмотр от лица пользователя.',
  })
  @ApiOkResponse({ type: OffersFeedResponseDto })
  findMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetOffersQueryDto,
  ): Promise<OffersFeedResponseDto> {
    // «От лица пользователя» — привилегия администратора; остальным игнорируем.
    const effectiveUserId =
      query.asUserId && user.role === UserRole.ADMIN
        ? query.asUserId
        : user.sub;
    return this.offersService.findForUser(effectiveUserId, query);
  }

  @Get('availability/:lotId')
  @ApiOperation({
    summary: 'Маскированные предпочтения владельца лота (по id лота)',
    description:
      'Для гейтинга выбора своих лотов в модалке обмена. Возвращает только факт интереса (множества id), id владельца не раскрывается.',
  })
  @ApiOkResponse({ type: PreferenceAvailabilityDto })
  @ApiNotFoundResponse({ description: 'Лот не найден' })
  getAvailabilityForLot(
    @Param('lotId') lotId: string,
  ): Promise<PreferenceAvailabilityDto> {
    return this.offersService.getAvailabilityForLot(lotId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить предложение по id (только участник; ADMIN — от лица)',
  })
  @ApiOkResponse({ type: OfferDetailDto })
  @ApiForbiddenResponse({ description: 'Вы не участник предложения' })
  @ApiNotFoundResponse({ description: 'Предложение не найдено' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('asUserId') asUserId?: string,
  ): Promise<OfferDetailDto> {
    return this.offersService.findOne(id, this.effectiveUser(user, asUserId));
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Принять предложение (получатель)' })
  @ApiOkResponse({ type: OfferDetailDto })
  accept(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('asUserId') asUserId?: string,
  ): Promise<OfferDetailDto> {
    return this.offersService.accept(id, this.effectiveUser(user, asUserId));
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Отклонить/отменить предложение (любой участник)' })
  @ApiOkResponse({ type: OfferDetailDto })
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('asUserId') asUserId?: string,
  ): Promise<OfferDetailDto> {
    return this.offersService.reject(id, this.effectiveUser(user, asUserId));
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Подтвердить факт обмена (когда подтвердят оба — выполнено)',
  })
  @ApiOkResponse({ type: OfferDetailDto })
  confirm(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('asUserId') asUserId?: string,
  ): Promise<OfferDetailDto> {
    return this.offersService.confirmCompletion(
      id,
      this.effectiveUser(user, asUserId),
    );
  }

  @Post(':id/report')
  @ApiOperation({
    summary: 'Пожаловаться на предложение — уведомить всех администраторов',
  })
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiForbiddenResponse({ description: 'Вы не участник предложения' })
  report(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('asUserId') asUserId?: string,
  ): Promise<{ success: true }> {
    return this.offersService.report(id, this.effectiveUser(user, asUserId));
  }

  /**
   * «От лица пользователя» — привилегия администратора. Остальным asUserId
   * игнорируется (работают только от своего имени).
   */
  private effectiveUser(user: JwtPayload, asUserId?: string): string {
    return asUserId && user.role === UserRole.ADMIN ? asUserId : user.sub;
  }
}
