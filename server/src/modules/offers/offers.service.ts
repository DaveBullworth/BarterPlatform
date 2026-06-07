import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { OfferEntity, OfferStatus } from '@/database/entities/offer.entity';
import { LotEntity, LotVisibilityStatus } from '@/database/entities/lot.entity';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';
import { NotificationsService } from '../notifications/notifications.service';
import { notificationBuilders } from '../notifications/notification.builders';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferResponseDto } from './dto/offer-response.dto';
import { GetOffersQueryDto } from './dto/get-offers-query.dto';
import { PreferenceAvailabilityDto } from '../user-preferences/dto/preference-availability.dto';
import { OfferErrorCode } from './errors/offers-error-codes';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(OfferEntity)
    private readonly offersRepo: Repository<OfferEntity>,
    @InjectRepository(LotEntity)
    private readonly lotsRepo: Repository<LotEntity>,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Создаёт предложение обмена. Все правила перепроверяются на сервере —
   * клиенту не доверяем.
   */
  async create(
    proposerId: string,
    dto: CreateOfferDto,
  ): Promise<OfferResponseDto> {
    const offeredLotIds = [...new Set(dto.offeredLotIds)];

    // 1) Целевой лот: существует, активен, не свой.
    const targetLot = await this.lotsRepo.findOne({ where: { id: dto.lotId } });
    if (!targetLot) {
      throw new NotFoundException({
        code: OfferErrorCode.TARGET_LOT_NOT_FOUND,
        message: 'Target lot not found',
      });
    }
    if (targetLot.visibilityStatus !== LotVisibilityStatus.ACTIVE) {
      throw new BadRequestException({
        code: OfferErrorCode.TARGET_LOT_INACTIVE,
        message: 'Target lot is not active',
      });
    }
    if (targetLot.userId === proposerId) {
      throw new BadRequestException({
        code: OfferErrorCode.SELF_OFFER_NOT_ALLOWED,
        message: 'Cannot make an offer on your own lot',
      });
    }
    const recipientId = targetLot.userId;

    // 2) Предлагаемые лоты: все принадлежат предлагающему и НЕ деактивированы
    //    (разрешены ACTIVE и HIDDEN, запрещён ARCHIVED).
    const offeredLots = await this.lotsRepo.find({
      where: {
        id: In(offeredLotIds),
        userId: proposerId,
        visibilityStatus: In([
          LotVisibilityStatus.ACTIVE,
          LotVisibilityStatus.HIDDEN,
        ]),
      },
    });
    if (offeredLots.length !== offeredLotIds.length) {
      throw new BadRequestException({
        code: OfferErrorCode.OFFERED_LOTS_INVALID,
        message: 'Some offered lots are invalid, not yours, or archived',
      });
    }

    // 3) Маскированный гейт: каждый предлагаемый лот должен попадать в
    //    предпочтения получателя.
    const availability =
      await this.userPreferencesService.getAvailabilityForUser(recipientId);
    const chapters = new Set(availability.chapterIds);
    const categories = new Set(availability.categoryIds);
    const subcategories = new Set(availability.subcategoryIds);

    const allPreferred = offeredLots.every((lot) =>
      this.isLotPreferred(lot, chapters, categories, subcategories),
    );
    if (!allPreferred) {
      throw new BadRequestException({
        code: OfferErrorCode.OFFERED_LOT_NOT_PREFERRED,
        message: "Some offered lots are outside the recipient's preferences",
      });
    }

    // 4) Дубликаты: одно активное предложение от proposer на этот лот.
    const existing = await this.offersRepo.findOne({
      where: {
        proposerId,
        lotId: dto.lotId,
        status: In([OfferStatus.PENDING, OfferStatus.ACCEPTED]),
      },
    });
    if (existing) {
      throw new ConflictException({
        code: OfferErrorCode.DUPLICATE_OFFER,
        message: 'You already have an active offer for this lot',
      });
    }

    const offer = this.offersRepo.create({
      proposerId,
      recipientId,
      lotId: dto.lotId,
      offeredLotIds,
      status: OfferStatus.PENDING,
    });
    const saved = await this.offersRepo.save(offer);

    // Получателю — уведомление о новом предложении (entityId под будущий
    // deep-link на страницу предложений).
    this.notificationsService.emit(
      notificationBuilders.offerReceived({
        recipientId,
        offerId: saved.id,
        lotTitle: targetLot.generalDescription,
        offeredCount: offeredLotIds.length,
      }),
    );

    return this.toResponseDto(saved);
  }

  async findForUser(
    userId: string,
    query: GetOffersQueryDto,
  ): Promise<OfferResponseDto[]> {
    const qb = this.offersRepo.createQueryBuilder('offer');

    if (query.role === 'incoming') {
      qb.where('offer.recipientId = :userId', { userId });
    } else if (query.role === 'outgoing') {
      qb.where('offer.proposerId = :userId', { userId });
    } else {
      qb.where('(offer.proposerId = :userId OR offer.recipientId = :userId)', {
        userId,
      });
    }

    if (query.status) {
      qb.andWhere('offer.status = :status', { status: query.status });
    }

    qb.orderBy('offer.createdAt', 'DESC');
    const offers = await qb.getMany();
    return offers.map((offer) => this.toResponseDto(offer));
  }

  async findOne(id: string, userId: string): Promise<OfferResponseDto> {
    const offer = await this.getParticipantOffer(id, userId);
    return this.toResponseDto(offer);
  }

  /**
   * Маскированные предпочтения ВЛАДЕЛЬЦА целевого лота — по id самого лота.
   * Клиент в ленте знает только lotId (userId владельца скрыт), поэтому
   * резолвим владельца на сервере и не раскрываем его id.
   */
  async getAvailabilityForLot(
    lotId: string,
  ): Promise<PreferenceAvailabilityDto> {
    const lot = await this.lotsRepo.findOne({ where: { id: lotId } });
    if (!lot) {
      throw new NotFoundException({
        code: OfferErrorCode.TARGET_LOT_NOT_FOUND,
        message: 'Target lot not found',
      });
    }
    return this.userPreferencesService.getAvailabilityForUser(lot.userId);
  }

  /** Получатель принимает предложение: PENDING → ACCEPTED. */
  async accept(id: string, userId: string): Promise<OfferResponseDto> {
    const offer = await this.getParticipantOffer(id, userId);

    if (offer.recipientId !== userId) {
      throw new ForbiddenException({
        code: OfferErrorCode.OFFER_FORBIDDEN,
        message: 'Only the recipient can accept the offer',
      });
    }
    if (offer.status !== OfferStatus.PENDING) {
      throw this.invalidTransition();
    }

    offer.status = OfferStatus.ACCEPTED;
    const saved = await this.offersRepo.save(offer);

    this.notificationsService.emit(
      notificationBuilders.offerAccepted({
        proposerId: saved.proposerId,
        offerId: saved.id,
      }),
    );

    return this.toResponseDto(saved);
  }

  /** Любой участник отказывается: PENDING|ACCEPTED → REJECTED. */
  async reject(id: string, userId: string): Promise<OfferResponseDto> {
    const offer = await this.getParticipantOffer(id, userId);

    if (
      offer.status !== OfferStatus.PENDING &&
      offer.status !== OfferStatus.ACCEPTED
    ) {
      throw this.invalidTransition();
    }

    offer.status = OfferStatus.REJECTED;
    const saved = await this.offersRepo.save(offer);

    // Уведомляем ДРУГУЮ сторону (не того, кто отклонил).
    const otherUserId =
      userId === saved.proposerId ? saved.recipientId : saved.proposerId;
    this.notificationsService.emit(
      notificationBuilders.offerRejected({
        userId: otherUserId,
        offerId: saved.id,
      }),
    );

    return this.toResponseDto(saved);
  }

  /**
   * Участник подтверждает факт обмена. Когда подтвердили ОБА — ACCEPTED →
   * COMPLETED.
   */
  async confirmCompletion(
    id: string,
    userId: string,
  ): Promise<OfferResponseDto> {
    const offer = await this.getParticipantOffer(id, userId);

    if (offer.status !== OfferStatus.ACCEPTED) {
      throw this.invalidTransition();
    }

    if (offer.proposerId === userId) offer.proposerCompletionConfirmed = true;
    if (offer.recipientId === userId) offer.recipientCompletionConfirmed = true;

    if (
      offer.proposerCompletionConfirmed &&
      offer.recipientCompletionConfirmed
    ) {
      offer.status = OfferStatus.COMPLETED;
    }

    const saved = await this.offersRepo.save(offer);

    // Обмен завершён — уведомляем обе стороны.
    if (saved.status === OfferStatus.COMPLETED) {
      this.notificationsService.emit(
        notificationBuilders.offerCompleted({
          userId: saved.proposerId,
          offerId: saved.id,
        }),
      );
      this.notificationsService.emit(
        notificationBuilders.offerCompleted({
          userId: saved.recipientId,
          offerId: saved.id,
        }),
      );
    }

    return this.toResponseDto(saved);
  }

  // ───────────────────────── helpers ─────────────────────────

  private async getParticipantOffer(
    id: string,
    userId: string,
  ): Promise<OfferEntity> {
    const offer = await this.offersRepo.findOne({ where: { id } });
    if (!offer) {
      throw new NotFoundException({
        code: OfferErrorCode.OFFER_NOT_FOUND,
        message: 'Offer not found',
      });
    }
    if (offer.proposerId !== userId && offer.recipientId !== userId) {
      throw new ForbiddenException({
        code: OfferErrorCode.OFFER_FORBIDDEN,
        message: 'You are not a participant of this offer',
      });
    }
    return offer;
  }

  private isLotPreferred(
    lot: LotEntity,
    chapters: Set<number>,
    categories: Set<number>,
    subcategories: Set<number>,
  ): boolean {
    if (chapters.has(lot.chapterId)) return true;
    if (categories.has(lot.categoryId)) return true;
    if (lot.subcategoryId != null && subcategories.has(lot.subcategoryId)) {
      return true;
    }
    return false;
  }

  private invalidTransition(): BadRequestException {
    return new BadRequestException({
      code: OfferErrorCode.INVALID_STATUS_TRANSITION,
      message: 'Action is not allowed for the current offer status',
    });
  }

  private toResponseDto(offer: OfferEntity): OfferResponseDto {
    return {
      id: offer.id,
      proposerId: offer.proposerId,
      recipientId: offer.recipientId,
      lotId: offer.lotId,
      offeredLotIds: offer.offeredLotIds,
      status: offer.status,
      proposerCompletionConfirmed: offer.proposerCompletionConfirmed,
      recipientCompletionConfirmed: offer.recipientCompletionConfirmed,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    };
  }
}
