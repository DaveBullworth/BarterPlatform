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
import { UserEntity, UserRole } from '@/database/entities/user.entity';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';
import { LotsService } from '../lots/lots.service';
import { NotificationsService } from '../notifications/notifications.service';
import { notificationBuilders } from '../notifications/notification.builders';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferResponseDto } from './dto/offer-response.dto';
import { GetOffersQueryDto } from './dto/get-offers-query.dto';
import {
  OfferFeedItemDto,
  OfferLotSummaryDto,
  OffersFeedResponseDto,
} from './dto/offer-feed.dto';
import { OfferDetailDto } from './dto/offer-detail.dto';
import { PreferenceAvailabilityDto } from '../user-preferences/dto/preference-availability.dto';
import { OfferErrorCode } from './errors/offers-error-codes';

/** Повторное предложение тому же лоту — не раньше часа с предыдущего. */
const OFFER_REPEAT_COOLDOWN_MS = 60 * 60 * 1000;

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(OfferEntity)
    private readonly offersRepo: Repository<OfferEntity>,
    @InjectRepository(LotEntity)
    private readonly lotsRepo: Repository<LotEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly lotsService: LotsService,
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

    // 5) Зеркальный дубликат: у получателя уже есть активное встречное
    //    предложение, где целевой и предлагаемые лоты поменяны местами.
    const mirrorExists = await this.offersRepo
      .createQueryBuilder('offer')
      .where('offer.proposerId = :recipientId', { recipientId })
      .andWhere('offer.recipientId = :proposerId', { proposerId })
      .andWhere('offer.status IN (:...activeStatuses)', {
        activeStatuses: [OfferStatus.PENDING, OfferStatus.ACCEPTED],
      })
      .andWhere('offer.lotId IN (:...offeredLotIds)', { offeredLotIds })
      .andWhere(':targetLotId = ANY(offer.offeredLotIds)', {
        targetLotId: dto.lotId,
      })
      .getExists();
    if (mirrorExists) {
      throw new ConflictException({
        code: OfferErrorCode.MIRROR_OFFER_EXISTS,
        message: 'A mirrored counter-offer with these lots already exists',
      });
    }

    // 6) Кулдаун: предыдущее предложение этому лоту (включая отклонённое)
    //    было меньше часа назад — просим подождать остаток времени.
    const lastOffer = await this.offersRepo.findOne({
      where: { proposerId, lotId: dto.lotId },
      order: { createdAt: 'DESC' },
    });
    if (lastOffer) {
      const elapsedMs = Date.now() - lastOffer.createdAt.getTime();
      if (elapsedMs < OFFER_REPEAT_COOLDOWN_MS) {
        const waitMinutes = Math.max(
          Math.ceil((OFFER_REPEAT_COOLDOWN_MS - elapsedMs) / 60_000),
          1,
        );
        throw new ConflictException({
          code: OfferErrorCode.OFFER_COOLDOWN,
          message:
            'An offer for this lot was made recently. Please wait before retrying',
          meta: { waitMinutes },
        });
      }
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

  /**
   * Лента предложений пользователя: пагинация, фильтр по роли и статусам,
   * сортировка по дате изменения. Каждый элемент обогащается сводками лотов
   * (раздел + краткое описание) и id участника-контрагента — чтобы клиент
   * рисовал строку без доп. запросов на каждый лот.
   */
  async findForUser(
    userId: string,
    query: GetOffersQueryDto,
  ): Promise<OffersFeedResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

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

    if (query.statuses?.length) {
      qb.andWhere('offer.status IN (:...statuses)', {
        statuses: query.statuses,
      });
    }

    qb.orderBy('offer.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [offers, total] = await qb.getManyAndCount();

    // Одним запросом тянем сводки всех задействованных лотов (целевой + предлагаемые).
    const lotIds = new Set<string>();
    for (const offer of offers) {
      lotIds.add(offer.lotId);
      offer.offeredLotIds.forEach((id) => lotIds.add(id));
    }

    const lots = lotIds.size
      ? await this.lotsRepo.find({
          where: { id: In([...lotIds]) },
          select: ['id', 'generalDescription', 'chapterId'],
        })
      : [];

    const lotMap = new Map<string, OfferLotSummaryDto>(
      lots.map((lot) => [
        lot.id,
        {
          id: lot.id,
          generalDescription: lot.generalDescription,
          chapterId: lot.chapterId,
        },
      ]),
    );

    const data: OfferFeedItemDto[] = offers.map((offer) => {
      const isOutgoing = offer.proposerId === userId;
      return {
        id: offer.id,
        status: offer.status,
        role: isOutgoing ? 'outgoing' : 'incoming',
        counterpartId: isOutgoing ? offer.recipientId : offer.proposerId,
        targetLot: lotMap.get(offer.lotId) ?? null,
        // Удалённые лоты просто выпадают из списка предлагаемых.
        offeredLots: offer.offeredLotIds.flatMap((id) => {
          const lot = lotMap.get(id);
          return lot ? [lot] : [];
        }),
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      };
    });

    return { data, total };
  }

  async findOne(id: string, userId: string): Promise<OfferDetailDto> {
    const offer = await this.getParticipantOffer(id, userId);
    return this.buildDetail(offer, userId);
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
  async accept(id: string, userId: string): Promise<OfferDetailDto> {
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
    offer.acceptedAt = new Date();
    const saved = await this.offersRepo.save(offer);

    this.notificationsService.emit(
      notificationBuilders.offerAccepted({
        proposerId: saved.proposerId,
        offerId: saved.id,
      }),
    );

    return this.buildDetail(saved, userId);
  }

  /** Любой участник отказывается: PENDING|ACCEPTED → REJECTED. */
  async reject(id: string, userId: string): Promise<OfferDetailDto> {
    const offer = await this.getParticipantOffer(id, userId);

    if (
      offer.status !== OfferStatus.PENDING &&
      offer.status !== OfferStatus.ACCEPTED
    ) {
      throw this.invalidTransition();
    }

    offer.status = OfferStatus.REJECTED;
    offer.rejectedAt = new Date();
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

    return this.buildDetail(saved, userId);
  }

  /**
   * Участник подтверждает факт обмена. Когда подтвердили ОБА — ACCEPTED →
   * COMPLETED: лоты переходят к новым владельцам со статусом HIDDEN, а
   * конкурирующие активные предложения на эти лоты автоматически отклоняются.
   */
  async confirmCompletion(id: string, userId: string): Promise<OfferDetailDto> {
    const offer = await this.getParticipantOffer(id, userId);

    if (offer.status !== OfferStatus.ACCEPTED) {
      throw this.invalidTransition();
    }

    if (offer.proposerId === userId) offer.proposerCompletionConfirmed = true;
    if (offer.recipientId === userId) offer.recipientCompletionConfirmed = true;

    const bothConfirmed =
      offer.proposerCompletionConfirmed && offer.recipientCompletionConfirmed;

    if (!bothConfirmed) {
      const saved = await this.offersRepo.save(offer);
      return this.buildDetail(saved, userId);
    }

    offer.status = OfferStatus.COMPLETED;
    offer.completedAt = new Date();

    // Завершение, передача лотов и отмена конкурирующих предложений —
    // атомарно: нельзя оставить лоты у старых владельцев при упавшем шаге.
    const movedLotIds = [offer.lotId, ...offer.offeredLotIds];
    let staleOffers: OfferEntity[] = [];

    const saved = await this.offersRepo.manager.transaction(async (manager) => {
      const savedOffer = await manager.save(offer);

      // Целевой лот уходит предлагавшему, предложенные — получателю.
      // Все переданные лоты скрываются: новый владелец сам решает, когда
      // выставить их снова.
      await manager.update(
        LotEntity,
        { id: savedOffer.lotId },
        {
          userId: savedOffer.proposerId,
          visibilityStatus: LotVisibilityStatus.HIDDEN,
        },
      );
      if (savedOffer.offeredLotIds.length) {
        await manager.update(
          LotEntity,
          { id: In(savedOffer.offeredLotIds) },
          {
            userId: savedOffer.recipientId,
            visibilityStatus: LotVisibilityStatus.HIDDEN,
          },
        );
      }

      // Остальные активные предложения, ссылающиеся на переданные лоты
      // (как на целевой или как на предлагаемые), больше не валидны —
      // их получатели/отправители уже не владеют этими лотами.
      staleOffers = await manager
        .getRepository(OfferEntity)
        .createQueryBuilder('offer')
        .where('offer.id != :completedId', { completedId: savedOffer.id })
        .andWhere('offer.status IN (:...activeStatuses)', {
          activeStatuses: [OfferStatus.PENDING, OfferStatus.ACCEPTED],
        })
        .andWhere(
          '(offer.lotId IN (:...movedIds) OR offer.offeredLotIds && :movedArr::uuid[])',
          { movedIds: movedLotIds, movedArr: movedLotIds },
        )
        .getMany();

      if (staleOffers.length) {
        const rejectedAt = new Date();
        for (const stale of staleOffers) {
          stale.status = OfferStatus.REJECTED;
          stale.rejectedAt = rejectedAt;
        }
        await manager.save(staleOffers);
      }

      return savedOffer;
    });

    // Обмен завершён — уведомляем обе стороны.
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

    // Участников авто-отклонённых предложений тоже уведомляем.
    for (const stale of staleOffers) {
      this.notificationsService.emit(
        notificationBuilders.offerRejected({
          userId: stale.proposerId,
          offerId: stale.id,
        }),
      );
      this.notificationsService.emit(
        notificationBuilders.offerRejected({
          userId: stale.recipientId,
          offerId: stale.id,
        }),
      );
    }

    return this.buildDetail(saved, userId);
  }

  /**
   * Жалоба участника на предложение — уведомление всем администраторам.
   * Сам инициатор (или админ от его лица) должен быть участником.
   */
  async report(id: string, userId: string): Promise<{ success: true }> {
    await this.getParticipantOffer(id, userId);

    const admins = await this.usersRepo.find({
      where: { role: UserRole.ADMIN, status: true },
      select: ['id'],
    });

    for (const admin of admins) {
      this.notificationsService.emit(
        notificationBuilders.offerReported({
          adminId: admin.id,
          offerId: id,
          reporterId: userId,
        }),
      );
    }

    return { success: true };
  }

  // ───────────────────────── helpers ─────────────────────────

  /** Собирает обогащённую карточку предложения для просматривающего. */
  private async buildDetail(
    offer: OfferEntity,
    viewerUserId: string,
  ): Promise<OfferDetailDto> {
    const isOutgoing = offer.proposerId === viewerUserId;
    const counterpartId = isOutgoing ? offer.recipientId : offer.proposerId;

    const counterpart = await this.usersRepo.findOne({
      where: { id: counterpartId },
      select: ['id', 'name'],
    });

    const [targetCard] = await this.lotsService.getCardsByIds([offer.lotId]);
    const offeredLots = await this.lotsService.getCardsByIds(
      offer.offeredLotIds,
    );

    const viewerConfirmed = isOutgoing
      ? offer.proposerCompletionConfirmed
      : offer.recipientCompletionConfirmed;

    const isParticipant =
      offer.proposerId === viewerUserId || offer.recipientId === viewerUserId;

    return {
      id: offer.id,
      status: offer.status,
      role: isOutgoing ? 'outgoing' : 'incoming',
      counterpart: {
        id: counterpartId,
        name: counterpart?.name ?? '',
      },
      targetLot: targetCard ?? null,
      offeredLots,
      proposerCompletionConfirmed: offer.proposerCompletionConfirmed,
      recipientCompletionConfirmed: offer.recipientCompletionConfirmed,
      viewerConfirmed,
      actions: {
        canAccept:
          !isOutgoing && isParticipant && offer.status === OfferStatus.PENDING,
        canReject:
          isParticipant &&
          (offer.status === OfferStatus.PENDING ||
            offer.status === OfferStatus.ACCEPTED),
        canConfirm:
          isParticipant &&
          offer.status === OfferStatus.ACCEPTED &&
          !viewerConfirmed,
      },
      createdAt: offer.createdAt,
      acceptedAt: offer.acceptedAt,
      completedAt: offer.completedAt,
      rejectedAt: offer.rejectedAt,
      updatedAt: offer.updatedAt,
    };
  }

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
