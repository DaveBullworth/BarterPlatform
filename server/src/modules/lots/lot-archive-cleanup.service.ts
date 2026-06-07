import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LotEntity, LotVisibilityStatus } from '@/database/entities/lot.entity';
import { RedisLotArchiveService } from '@/common/services/redis/redis.archive';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { notificationBuilders } from '@/modules/notifications/notification.builders';

@Injectable()
export class LotArchiveCleanupService implements OnModuleInit, OnModuleDestroy {
  private static readonly ARCHIVE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  private static readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
  /** За сколько до авто-удаления предупреждаем владельца. */
  private static readonly WARN_LEAD_MS = 3 * 24 * 60 * 60 * 1000;

  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(LotEntity)
    private readonly lotsRepo: Repository<LotEntity>,
    private readonly redisArchive: RedisLotArchiveService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.run().catch(() => undefined);

    this.timer = setInterval(() => {
      this.run().catch(() => undefined);
    }, LotArchiveCleanupService.CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async run() {
    const now = Date.now();

    // 1) Предупреждаем владельцев за WARN_LEAD до авто-удаления (раз на лот).
    await this.warnUpcomingDeletions(now);

    // 2) Удаляем архивные лоты, перешагнувшие TTL.
    const threshold = new Date(now - LotArchiveCleanupService.ARCHIVE_TTL_MS);

    const lotIds =
      await this.redisArchive.getArchivedLotIdsDueForDeletion(threshold);

    if (!lotIds.length) return;

    await this.lotsRepo
      .createQueryBuilder()
      .delete()
      .from(LotEntity)
      .where('id IN (:...ids)', { ids: lotIds })
      .andWhere('visibilityStatus = :status', {
        status: LotVisibilityStatus.ARCHIVED,
      })
      .execute();

    await this.redisArchive.unmarkArchivedLots(lotIds);
  }

  private async warnUpcomingDeletions(now: number) {
    const from = new Date(now - LotArchiveCleanupService.ARCHIVE_TTL_MS);
    const to = new Date(
      now -
        (LotArchiveCleanupService.ARCHIVE_TTL_MS -
          LotArchiveCleanupService.WARN_LEAD_MS),
    );

    const candidates = await this.redisArchive.getArchivedLotIdsDueForWarning(
      from,
      to,
    );
    const toWarn = await this.redisArchive.filterUnwarnedAndMark(candidates);
    if (!toWarn.length) return;

    const lots = await this.lotsRepo.find({
      where: {
        id: In(toWarn),
        visibilityStatus: LotVisibilityStatus.ARCHIVED,
      },
      select: ['id', 'userId', 'generalDescription'],
    });

    const daysLeft = Math.ceil(
      LotArchiveCleanupService.WARN_LEAD_MS / (24 * 60 * 60 * 1000),
    );

    for (const lot of lots) {
      this.notificationsService.emit(
        notificationBuilders.lotDeletionScheduled({
          userId: lot.userId,
          lotId: lot.id,
          lotTitle: lot.generalDescription,
          daysLeft,
        }),
      );
    }
  }
}
