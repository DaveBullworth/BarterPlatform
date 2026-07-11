import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { CHAT_MESSAGES_MAX_PAGE_SIZE } from '../chat.constants';

export class GetMessagesQueryDto {
  @ApiPropertyOptional({
    description:
      'Курсор: id самого старого уже загруженного сообщения. Вернёт более старые сообщения (подгрузка истории вверх).',
  })
  @IsOptional()
  @IsUUID()
  before?: string;

  @ApiPropertyOptional({ default: 30, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CHAT_MESSAGES_MAX_PAGE_SIZE)
  limit?: number;
}
