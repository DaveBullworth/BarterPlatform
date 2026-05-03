import { RedisLotArchiveService } from '@/common/services/redis/redis.archive';
import { LotVisibilityStatus } from '@/database/entities/lot.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LotArchiveService {
  constructor(private readonly redis: RedisLotArchiveService) {}

  async sync(
    lotId: string,
    prev: LotVisibilityStatus,
    next: LotVisibilityStatus,
  ): Promise<Date | null> {
    if (
      prev !== LotVisibilityStatus.ARCHIVED &&
      next === LotVisibilityStatus.ARCHIVED
    ) {
      return this.redis.markLotArchived(lotId);
    }

    if (
      prev === LotVisibilityStatus.ARCHIVED &&
      next !== LotVisibilityStatus.ARCHIVED
    ) {
      await this.redis.unmarkLotArchived(lotId);
    }

    return null;
  }

  async getArchivationDate(lotId: string): Promise<Date | null> {
    return this.redis.getLotArchivationDate(lotId);
  }

  async remove(lotId: string) {
    await this.redis.unmarkLotArchived(lotId);
  }
}
