import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { LotEntity } from '@/database/entities/lot.entity';
import { UserEntity } from '@/database/entities/user.entity';
import { VersionedEntity } from '@/common/types/versioned.type';
import { DataSource } from 'typeorm/data-source/index.js';

@Injectable()
export class RedisVersionService {
  private static readonly VERSION_CONFIG = {
    user: {
      keyPrefix: 'user:updated:',
      ttl: 60 * 60 * 24 * 3,
      jitter: 60 * 60 * 6,
      repo: UserEntity,
    },
    lot: {
      keyPrefix: 'lot:updated:',
      ttl: 60 * 60 * 24 * 3,
      jitter: 60 * 60 * 6,
      repo: LotEntity,
    },
  } as const;

  constructor(
    private readonly redis: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  // Подсервис валидации кеша записей (ETag / If-None-Match)

  private getUpdatedKey(type: VersionedEntity, id: string) {
    return `${RedisVersionService.VERSION_CONFIG[type].keyPrefix}${id}`;
  }

  private getTtl(type: VersionedEntity) {
    const cfg = RedisVersionService.VERSION_CONFIG[type];
    return cfg.ttl + Math.floor(Math.random() * cfg.jitter);
  }

  private buildEtag(type: VersionedEntity, updatedAt: Date) {
    return `W/"${type}:${updatedAt.getTime()}"`;
  }

  private async getUpdatedAt(
    type: VersionedEntity,
    id: string,
  ): Promise<Date | null> {
    const client = this.redis.getClient();
    const key = this.getUpdatedKey(type, id);

    const cached = await client.get(key);

    if (cached) {
      const date = new Date(cached);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    const repo = this.dataSource.getRepository(
      RedisVersionService.VERSION_CONFIG[type].repo,
    );

    const entity = await repo.findOne({
      where: { id },
      select: ['id', 'updatedAt'],
    });

    if (!entity) return null;

    await this.updateTimestamp(type, id, entity.updatedAt);
    return entity.updatedAt;
  }

  async updateTimestamp(type: VersionedEntity, id: string, date?: Date) {
    const client = this.redis.getClient();

    await client.set(
      this.getUpdatedKey(type, id),
      (date ?? new Date()).toISOString(),
      { EX: this.getTtl(type) },
    );
  }

  async deleteTimestamp(type: VersionedEntity, id: string) {
    const client = this.redis.getClient();
    await client.del(this.getUpdatedKey(type, id));
  }

  async getUserEtag(userId: string) {
    const updatedAt = await this.getUpdatedAt('user', userId);
    return updatedAt ? this.buildEtag('user', updatedAt) : null;
  }

  async getLotEtag(lotId: string) {
    const updatedAt = await this.getUpdatedAt('lot', lotId);
    return updatedAt ? this.buildEtag('lot', updatedAt) : null;
  }
}
