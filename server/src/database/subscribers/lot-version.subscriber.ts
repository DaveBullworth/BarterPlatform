import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';

import { LotEntity } from '@/database/entities/lot.entity';
import { RedisVersionService } from '@/common/services/redis/redis.version';
import { VersionedEntity } from '@/common/types/versioned.type';

@Injectable()
@EventSubscriber()
export class LotVersionSubscriber implements EntitySubscriberInterface<LotEntity> {
  private static readonly VERSION_ENTITY: VersionedEntity = 'lot';

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisVersionService: RedisVersionService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return LotEntity;
  }

  async afterInsert(event: InsertEvent<LotEntity>) {
    if (!event.entity?.id) return;

    await this.redisVersionService.updateTimestamp(
      LotVersionSubscriber.VERSION_ENTITY,
      event.entity.id,
      event.entity.updatedAt,
    );
  }

  async afterUpdate(event: UpdateEvent<LotEntity>) {
    const entity = event.entity as Partial<LotEntity> | undefined;
    const dbEntity = event.databaseEntity as Partial<LotEntity> | undefined;

    const lotId = entity?.id ?? dbEntity?.id;
    if (!lotId) return;

    await this.redisVersionService.updateTimestamp(
      LotVersionSubscriber.VERSION_ENTITY,
      lotId,
      entity?.updatedAt ?? dbEntity?.updatedAt ?? new Date(),
    );
  }

  async afterRemove(event: RemoveEvent<LotEntity>) {
    const lotId =
      typeof event.entityId === 'string'
        ? event.entityId
        : (event.databaseEntity?.id as string | undefined);

    if (!lotId) return;

    await this.redisVersionService.deleteTimestamp(
      LotVersionSubscriber.VERSION_ENTITY,
      lotId,
    );
  }
}
