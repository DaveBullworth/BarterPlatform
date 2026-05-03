import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';

import { UserEntity } from '@/database/entities/user.entity';
import { redisLogger } from '@/common/services/logger/logger.scopes';
import { RedisVersionService } from '@/common/services/redis/redis.version';
import { VersionedEntity } from '@/common/types/versioned.type';

@Injectable()
@EventSubscriber()
export class UserVersionSubscriber implements EntitySubscriberInterface<UserEntity> {
  private static readonly VERSION_ENTITY: VersionedEntity = 'user';

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisVersionService: RedisVersionService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return UserEntity;
  }

  async afterInsert(event: InsertEvent<UserEntity>) {
    if (!event.entity?.id) return;

    await this.redisVersionService.updateTimestamp(
      UserVersionSubscriber.VERSION_ENTITY,
      event.entity.id,
      event.entity.updatedAt,
    );

    redisLogger.debug('user_version_subscriber_insert', {
      userId: event.entity.id,
    });
  }

  async afterUpdate(event: UpdateEvent<UserEntity>) {
    const userId = this.getUserIdFromUpdateEvent(event);
    if (!userId) return;

    const updatedAt = this.getUpdatedAtFromUpdateEvent(event);

    await this.redisVersionService.updateTimestamp(
      UserVersionSubscriber.VERSION_ENTITY,
      userId,
      updatedAt,
    );

    redisLogger.debug('user_version_subscriber_update', {
      userId,
    });
  }

  async afterRemove(event: RemoveEvent<UserEntity>) {
    const userId = this.getUserIdFromRemoveEvent(event);
    if (!userId) return;

    await this.redisVersionService.deleteTimestamp(
      UserVersionSubscriber.VERSION_ENTITY,
      userId,
    );

    redisLogger.debug('user_version_subscriber_remove', {
      userId,
    });
  }

  private getUserIdFromUpdateEvent(event: UpdateEvent<UserEntity>) {
    const entity = event.entity as Partial<UserEntity> | undefined;
    const entityId = entity?.id;
    if (typeof entityId === 'string') return entityId;

    const databaseEntity = event.databaseEntity as
      | Partial<UserEntity>
      | undefined;
    const dbEntityId = databaseEntity?.id;
    if (typeof dbEntityId === 'string') return dbEntityId;

    return null;
  }

  private getUpdatedAtFromUpdateEvent(event: UpdateEvent<UserEntity>) {
    const entity = event.entity as Partial<UserEntity> | undefined;
    const entityUpdatedAt = entity?.updatedAt;
    if (entityUpdatedAt instanceof Date) return entityUpdatedAt;

    const databaseEntity = event.databaseEntity as
      | Partial<UserEntity>
      | undefined;
    const dbEntityUpdatedAt = databaseEntity?.updatedAt;
    if (dbEntityUpdatedAt instanceof Date) return dbEntityUpdatedAt;

    return new Date();
  }

  private getUserIdFromRemoveEvent(event: RemoveEvent<UserEntity>) {
    if (typeof event.entityId === 'string') return event.entityId;

    const dbEntityId = event.databaseEntity?.id;
    if (typeof dbEntityId === 'string') return dbEntityId;

    return null;
  }
}
