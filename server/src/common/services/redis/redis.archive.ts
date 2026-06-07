import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisLotArchiveService {
  private static readonly ARCHIVED_LOTS_SET_KEY = 'lot:archived:index';
  /** Лоты, по которым уже отправлено предупреждение «удалю через N дней». */
  private static readonly DELETION_WARNED_SET_KEY = 'lot:deletion-warned:index';

  constructor(private readonly redis: RedisService) {}

  async markLotArchived(lotId: string, archivedAt: Date = new Date()) {
    const client = this.redis.getClient();
    // const key = `${RedisService.ARCHIVED_LOT_KEY_PREFIX}${lotId}`;
    // const payload = JSON.stringify({
    //   lotId,
    //   archivedAt: archivedAt.toISOString(),
    // });
    // const ttlSeconds = 30 * 24 * 60 * 60;

    await client
      .multi()
      // .set(key, payload, { EX: ttlSeconds })
      .zAdd(RedisLotArchiveService.ARCHIVED_LOTS_SET_KEY, {
        score: archivedAt.getTime(),
        value: lotId,
      })
      .exec();

    return archivedAt;
  }

  async unmarkLotArchived(lotId: string) {
    const client = this.redis.getClient();

    await client
      .multi()
      // .del(`${RedisService.ARCHIVED_LOT_KEY_PREFIX}${lotId}`)
      .zRem(RedisLotArchiveService.ARCHIVED_LOTS_SET_KEY, lotId)
      .sRem(RedisLotArchiveService.DELETION_WARNED_SET_KEY, lotId)
      .exec();
  }

  async getArchivedLotIdsDueForDeletion(before: Date, limit = 200) {
    const client = this.redis.getClient();

    return client.zRangeByScore(
      RedisLotArchiveService.ARCHIVED_LOTS_SET_KEY,
      0,
      before.getTime(),
      { LIMIT: { offset: 0, count: limit } },
    );
  }

  /**
   * Лоты, заархивированные в окне [from, to] — т.е. до удаления которым осталось
   * ~ (TTL - возраст). Используется для предупреждения «удалю через N дней».
   */
  async getArchivedLotIdsDueForWarning(from: Date, to: Date, limit = 200) {
    const client = this.redis.getClient();

    return client.zRangeByScore(
      RedisLotArchiveService.ARCHIVED_LOTS_SET_KEY,
      from.getTime(),
      to.getTime(),
      { LIMIT: { offset: 0, count: limit } },
    );
  }

  /**
   * Из переданных id оставляет только те, по которым предупреждение ещё НЕ
   * слали, и тут же помечает их как предупреждённые (чтобы не спамить каждый час).
   */
  async filterUnwarnedAndMark(ids: string[]): Promise<string[]> {
    if (!ids.length) return [];

    const client = this.redis.getClient();
    const warned = new Set(
      await client.sMembers(RedisLotArchiveService.DELETION_WARNED_SET_KEY),
    );
    const unwarned = ids.filter((id) => !warned.has(id));

    if (unwarned.length) {
      await client.sAdd(
        RedisLotArchiveService.DELETION_WARNED_SET_KEY,
        unwarned,
      );
    }

    return unwarned;
  }

  async getLotArchivationDate(lotId: string): Promise<Date | null> {
    const client = this.redis.getClient();
    const score = await client.zScore(
      RedisLotArchiveService.ARCHIVED_LOTS_SET_KEY,
      lotId,
    );

    if (score == null) {
      return null;
    }

    return new Date(score);
  }

  async unmarkArchivedLots(lotIds: string[]) {
    if (!lotIds.length) return;

    const client = this.redis.getClient();
    const pipeline = client.multi();

    pipeline.zRem(RedisLotArchiveService.ARCHIVED_LOTS_SET_KEY, lotIds);
    pipeline.sRem(RedisLotArchiveService.DELETION_WARNED_SET_KEY, lotIds);
    // lotIds.forEach((lotId) => {
    //   pipeline.del(`${RedisService.ARCHIVED_LOT_KEY_PREFIX}${lotId}`);
    // });

    await pipeline.exec();
  }
}
