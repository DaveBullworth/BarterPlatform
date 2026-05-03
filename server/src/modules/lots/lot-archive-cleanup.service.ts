import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LotEntity } from '@/database/entities/lot.entity';
import { RedisLotArchiveService } from '@/common/services/redis/redis.archive';
import { LotVisibilityStatus } from '@/database/entities/lot.entity';

@Injectable()
export class LotArchiveCleanupService implements OnModuleInit, OnModuleDestroy {
  private static readonly ARCHIVE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  private static readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(LotEntity)
    private readonly lotsRepo: Repository<LotEntity>,
    private readonly redisArchive: RedisLotArchiveService,
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
    const threshold = new Date(
      Date.now() - LotArchiveCleanupService.ARCHIVE_TTL_MS,
    );

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
}
