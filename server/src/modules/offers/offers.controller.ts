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
import { PreferenceAvailabilityDto } from '../user-preferences/dto/preference-availability.dto';

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
    summary: 'Список моих предложений (входящие/исходящие)',
  })
  @ApiOkResponse({ type: [OfferResponseDto] })
  findMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetOffersQueryDto,
  ): Promise<OfferResponseDto[]> {
    return this.offersService.findForUser(user.sub, query);
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
  @ApiOperation({ summary: 'Получить предложение по id (только участник)' })
  @ApiOkResponse({ type: OfferResponseDto })
  @ApiForbiddenResponse({ description: 'Вы не участник предложения' })
  @ApiNotFoundResponse({ description: 'Предложение не найдено' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<OfferResponseDto> {
    return this.offersService.findOne(id, user.sub);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Принять предложение (получатель)' })
  @ApiOkResponse({ type: OfferResponseDto })
  accept(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<OfferResponseDto> {
    return this.offersService.accept(id, user.sub);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Отклонить/отменить предложение (любой участник)' })
  @ApiOkResponse({ type: OfferResponseDto })
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<OfferResponseDto> {
    return this.offersService.reject(id, user.sub);
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Подтвердить факт обмена (когда подтвердят оба — выполнено)',
  })
  @ApiOkResponse({ type: OfferResponseDto })
  confirm(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<OfferResponseDto> {
    return this.offersService.confirmCompletion(id, user.sub);
  }
}
