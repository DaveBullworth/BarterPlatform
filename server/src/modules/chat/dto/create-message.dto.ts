import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import {
  CHAT_MAX_ATTACHMENTS_PER_MESSAGE,
  CHAT_MAX_TEXT_LENGTH,
} from '../chat.constants';

/**
 * Создание сообщения. Должно содержать текст ИЛИ хотя бы одно ранее загруженное
 * вложение (проверяется в сервисе). Вложения загружаются отдельным multipart-
 * запросом и здесь только привязываются по id.
 */
export class CreateMessageDto {
  @ApiPropertyOptional({ description: 'Текст сообщения' })
  @IsOptional()
  @IsString()
  @MaxLength(CHAT_MAX_TEXT_LENGTH)
  text?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'ID ранее загруженных (ещё не привязанных) вложений',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(CHAT_MAX_ATTACHMENTS_PER_MESSAGE)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  attachmentIds?: string[];
}
