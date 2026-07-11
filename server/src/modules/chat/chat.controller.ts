import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Authenticated } from '../auth/auth.decorator';
import { CurrentUser } from '../auth/user.decorator';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import {
  ChatAttachmentResponseDto,
  ChatMessageResponseDto,
  ChatMessagesPageDto,
  ChatUnreadByOfferItemDto,
} from './dto/message-response.dto';
import { ChatAttachmentKind } from '@/database/entities/chat-attachment.entity';
import { ChatErrorCode } from './errors/chat-error-codes';
import { CHAT_ALLOWED_MIME, CHAT_MAX_UPLOAD_BYTES } from './chat.constants';

@ApiBearerAuth()
@ApiTags('Chat')
@Authenticated()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('unread-count')
  @ApiOperation({ summary: 'Суммарно непрочитанных сообщений (бейдж навигации)' })
  @ApiOkResponse({ schema: { example: { count: 3 } } })
  async unreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ count: number }> {
    return { count: await this.chatService.getUnreadCount(user.sub) };
  }

  @Get('unread/by-offer')
  @ApiOperation({
    summary: 'Непрочитанные сообщения по офферам (бейджи в ленте предложений)',
  })
  @ApiOkResponse({ type: [ChatUnreadByOfferItemDto] })
  unreadByOffer(
    @CurrentUser() user: JwtPayload,
  ): Promise<ChatUnreadByOfferItemDto[]> {
    return this.chatService.getUnreadByOffer(user.sub);
  }

  @Get('offers/:offerId/messages')
  @ApiOperation({
    summary: 'Сообщения диалога (участник; cursor-пагинация истории)',
  })
  @ApiOkResponse({ type: ChatMessagesPageDto })
  getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('offerId') offerId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<ChatMessagesPageDto> {
    return this.chatService.getMessages(offerId, user.sub, query);
  }

  @Post('offers/:offerId/messages')
  @ApiOperation({ summary: 'Отправить сообщение (текст и/или вложения)' })
  @ApiOkResponse({ type: ChatMessageResponseDto })
  createMessage(
    @CurrentUser() user: JwtPayload,
    @Param('offerId') offerId: string,
    @Body() dto: CreateMessageDto,
  ): Promise<ChatMessageResponseDto> {
    return this.chatService.createMessage(offerId, user.sub, dto);
  }

  @Post('offers/:offerId/attachments')
  @ApiOperation({
    summary: 'Загрузить вложение (PNG/JPG/PDF) — проверяется антивирусом',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: ChatAttachmentResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: CHAT_MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!CHAT_ALLOWED_MIME.includes(file.mimetype)) {
          return cb(
            new BadRequestException({
              code: ChatErrorCode.FILE_WRONG_TYPE,
              message: 'Only PNG, JPG and PDF are allowed',
            }),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadAttachment(
    @CurrentUser() user: JwtPayload,
    @Param('offerId') offerId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ChatAttachmentResponseDto> {
    return this.chatService.uploadAttachment(offerId, user.sub, file);
  }

  @Post('offers/:offerId/read')
  @ApiOperation({ summary: 'Пометить входящие сообщения прочитанными' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('offerId') offerId: string,
  ): Promise<{ success: true }> {
    return this.chatService.markRead(offerId, user.sub);
  }

  @Get('offers/:offerId/file/:attachmentId')
  @ApiOperation({ summary: 'Скачать приватное вложение (только участник)' })
  async getAttachmentFile(
    @CurrentUser() user: JwtPayload,
    @Param('offerId') offerId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.chatService.getAttachmentForDownload(
      offerId,
      attachmentId,
      user.sub,
    );

    // Изображения — inline (превью), документы — attachment (скачивание).
    const disposition =
      file.kind === ChatAttachmentKind.IMAGE ? 'inline' : 'attachment';
    const safeName = encodeURIComponent(file.originalName);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${safeName}`,
    );
    res.sendFile(file.absPath);
  }
}
