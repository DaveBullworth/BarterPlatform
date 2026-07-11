import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';

import { ChatMessageEntity } from '@/database/entities/chat-message.entity';
import {
  ChatAttachmentEntity,
  ChatAttachmentKind,
  ChatAttachmentScanStatus,
} from '@/database/entities/chat-attachment.entity';
import { OfferEntity } from '@/database/entities/offer.entity';
import { UserEntity } from '@/database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsRealtimeService } from '../notifications/notifications.realtime.service';
import { notificationBuilders } from '../notifications/notification.builders';
import { FileScanService } from './file-scan/file-scan.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import {
  ChatAttachmentResponseDto,
  ChatMessageResponseDto,
  ChatMessagesPageDto,
  ChatUnreadByOfferItemDto,
} from './dto/message-response.dto';
import { ChatErrorCode } from './errors/chat-error-codes';
import {
  CHAT_ALLOWED_DOC_MIME,
  CHAT_ALLOWED_IMAGE_MIME,
  CHAT_MAX_DOC_BYTES,
  CHAT_MAX_IMAGE_BYTES,
  CHAT_MESSAGES_PAGE_SIZE,
} from './chat.constants';

type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly chatPath = path.join(process.cwd(), 'media', 'chat');

  constructor(
    @InjectRepository(ChatMessageEntity)
    private readonly messagesRepo: Repository<ChatMessageEntity>,
    @InjectRepository(ChatAttachmentEntity)
    private readonly attachmentsRepo: Repository<ChatAttachmentEntity>,
    @InjectRepository(OfferEntity)
    private readonly offersRepo: Repository<OfferEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly notifications: NotificationsService,
    private readonly realtime: NotificationsRealtimeService,
    private readonly fileScan: FileScanService,
  ) {}

  // ───────────────────────── messages ─────────────────────────

  /** Страница сообщений (старые → новые). `before` подгружает историю вверх. */
  async getMessages(
    offerId: string,
    userId: string,
    query: GetMessagesQueryDto,
  ): Promise<ChatMessagesPageDto> {
    await this.getParticipantOffer(offerId, userId);

    const limit = query.limit ?? CHAT_MESSAGES_PAGE_SIZE;

    const qb = this.messagesRepo
      .createQueryBuilder('m')
      .where('m.offerId = :offerId', { offerId });

    if (query.before) {
      const cursor = await this.messagesRepo.findOne({
        where: { id: query.before, offerId },
      });
      if (cursor) {
        qb.andWhere(
          '(m.createdAt < :ts OR (m.createdAt = :ts AND m.id < :id))',
          { ts: cursor.createdAt, id: cursor.id },
        );
      }
    }

    // Берём на одну больше, чтобы понять, есть ли ещё история.
    const rows = await qb
      .orderBy('m.createdAt', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    pageRows.reverse(); // в хронологический порядок

    const attachmentsByMessage = await this.loadAttachments(
      pageRows.map((m) => m.id),
    );

    return {
      data: pageRows.map((m) =>
        this.toMessageDto(m, userId, attachmentsByMessage.get(m.id) ?? []),
      ),
      hasMore,
    };
  }

  async createMessage(
    offerId: string,
    userId: string,
    dto: CreateMessageDto,
  ): Promise<ChatMessageResponseDto> {
    const offer = await this.getParticipantOffer(offerId, userId);

    const text = dto.text?.trim() ? dto.text.trim() : null;
    const attachmentIds = dto.attachmentIds ?? [];

    if (!text && attachmentIds.length === 0) {
      throw new BadRequestException({
        code: ChatErrorCode.EMPTY_MESSAGE,
        message: 'Message must contain text or at least one attachment',
      });
    }

    // Привязываемые вложения должны принадлежать этому офферу и автору и быть
    // ещё не привязанными (orphan).
    let attachments: ChatAttachmentEntity[] = [];
    if (attachmentIds.length) {
      attachments = await this.attachmentsRepo.find({
        where: {
          id: In(attachmentIds),
          offerId,
          uploaderId: userId,
          messageId: IsNull(),
        },
      });
      if (attachments.length !== attachmentIds.length) {
        throw new BadRequestException({
          code: ChatErrorCode.ATTACHMENTS_INVALID,
          message: 'Some attachments are invalid, not yours, or already sent',
        });
      }
    }

    const message = await this.messagesRepo.save(
      this.messagesRepo.create({ offerId, senderId: userId, text }),
    );

    if (attachments.length) {
      await this.attachmentsRepo.update(
        { id: In(attachments.map((a) => a.id)) },
        { messageId: message.id },
      );
    }

    const recipientId = this.counterpartOf(offer, userId);

    // Real-time контрагенту: открытый чат подхватит сообщение, бейджи обновятся.
    void this.publish(recipientId, {
      kind: 'chat:message',
      offerId,
      messageId: message.id,
      senderId: userId,
    });
    void this.emitUnread(recipientId);

    // Колокольчик — коалесцированно (одно уведомление на оффер до прочтения).
    const sender = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['name'],
    });
    this.notifications.emitChatMessage(
      notificationBuilders.chatMessage({
        recipientId,
        offerId,
        senderName: sender?.name ?? '',
        preview: text ? text.slice(0, 120) : '📎',
      }),
    );

    return this.toMessageDto(message, userId, attachments);
  }

  /** Помечает входящие сообщения прочитанными; гасит бейджи и колокольчик. */
  async markRead(
    offerId: string,
    userId: string,
  ): Promise<{ success: true }> {
    const offer = await this.getParticipantOffer(offerId, userId);

    const result = await this.messagesRepo.update(
      { offerId, senderId: Not(userId), readAt: IsNull() },
      { readAt: new Date() },
    );

    if (result.affected) {
      const counterpartId = this.counterpartOf(offer, userId);
      // Автор прочитанных сообщений видит, что они прочитаны (галочки).
      void this.publish(counterpartId, {
        kind: 'chat:read',
        offerId,
        readerId: userId,
      });
      void this.emitUnread(userId);
    }

    await this.notifications.markChatNotificationRead(userId, offerId);

    return { success: true };
  }

  // ───────────────────────── attachments ─────────────────────────

  async uploadAttachment(
    offerId: string,
    userId: string,
    file: UploadedFile | undefined,
  ): Promise<ChatAttachmentResponseDto> {
    await this.getParticipantOffer(offerId, userId);

    if (!file) {
      throw new BadRequestException({
        code: ChatErrorCode.FILE_REQUIRED,
        message: 'File is required',
      });
    }

    const kind = this.kindForMime(file.mimetype);
    const maxBytes =
      kind === ChatAttachmentKind.IMAGE
        ? CHAT_MAX_IMAGE_BYTES
        : CHAT_MAX_DOC_BYTES;
    if (file.size > maxBytes) {
      throw new BadRequestException({
        code: ChatErrorCode.FILE_TOO_LARGE,
        message: 'File is too large',
        meta: { maxBytes },
      });
    }

    // Антивирус: при выключённом сканере — skipped (offline/dev). При включённом
    // заражённый отклоняем, а сбой проверки трактуем как недоступность (fail-closed).
    const scan = await this.fileScan.scan(file.buffer);
    if (scan.status === 'infected') {
      throw new BadRequestException({
        code: ChatErrorCode.FILE_INFECTED,
        message: 'File failed antivirus check',
        meta: { signature: scan.signature ?? null },
      });
    }
    if (scan.status === 'error') {
      throw new ServiceUnavailableException({
        code: ChatErrorCode.FILE_SCAN_FAILED,
        message: 'Antivirus check is temporarily unavailable',
      });
    }
    const scanStatus =
      scan.status === 'clean'
        ? ChatAttachmentScanStatus.CLEAN
        : ChatAttachmentScanStatus.SKIPPED;

    const id = randomUUID();
    const ext = this.extForMime(file.mimetype);
    const relPath = `chat/${offerId}/${id}.${ext}`;

    try {
      const dir = path.join(this.chatPath, offerId);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, `${id}.${ext}`), file.buffer);
    } catch (err) {
      this.logger.error(
        `Failed to store chat attachment: ${String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException({
        code: ChatErrorCode.FILE_STORAGE_ERROR,
        message: 'Failed to store attachment',
      });
    }

    const attachment = await this.attachmentsRepo.save(
      this.attachmentsRepo.create({
        offerId,
        messageId: null,
        uploaderId: userId,
        kind,
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.originalname,
        path: relPath,
        scanStatus,
      }),
    );

    return this.toAttachmentDto(attachment);
  }

  /** Абсолютный путь приватного файла — только участнику оффера. */
  async getAttachmentForDownload(
    offerId: string,
    attachmentId: string,
    userId: string,
  ): Promise<{
    absPath: string;
    mimeType: string;
    originalName: string;
    kind: ChatAttachmentKind;
  }> {
    await this.getParticipantOffer(offerId, userId);

    const attachment = await this.attachmentsRepo.findOne({
      where: { id: attachmentId, offerId },
    });
    if (!attachment) {
      throw new NotFoundException({
        code: ChatErrorCode.ATTACHMENT_NOT_FOUND,
        message: 'Attachment not found',
      });
    }

    return {
      absPath: path.join(process.cwd(), 'media', attachment.path),
      mimeType: attachment.mimeType,
      originalName: attachment.originalName,
      kind: attachment.kind,
    };
  }

  // ───────────────────────── unread ─────────────────────────

  getUnreadCount(userId: string): Promise<number> {
    return this.unreadBaseQuery(userId).getCount();
  }

  async getUnreadByOffer(userId: string): Promise<ChatUnreadByOfferItemDto[]> {
    const rows = await this.unreadBaseQuery(userId)
      .select('m.offerId', 'offerId')
      .addSelect('COUNT(*)', 'unread')
      .groupBy('m.offerId')
      .getRawMany<{ offerId: string; unread: string }>();

    return rows.map((r) => ({ offerId: r.offerId, unread: Number(r.unread) }));
  }

  // ───────────────────────── helpers ─────────────────────────

  /** Непрочитанные входящие сообщения по всем офферам, где userId — участник. */
  private unreadBaseQuery(userId: string) {
    return this.messagesRepo
      .createQueryBuilder('m')
      .innerJoin(OfferEntity, 'o', 'o.id = m.offerId')
      .where('m.senderId != :userId', { userId })
      .andWhere('m.readAt IS NULL')
      .andWhere('(o.proposerId = :userId OR o.recipientId = :userId)', {
        userId,
      });
  }

  private async getParticipantOffer(
    offerId: string,
    userId: string,
  ): Promise<OfferEntity> {
    const offer = await this.offersRepo.findOne({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException({
        code: ChatErrorCode.OFFER_NOT_FOUND,
        message: 'Offer not found',
      });
    }
    if (offer.proposerId !== userId && offer.recipientId !== userId) {
      throw new ForbiddenException({
        code: ChatErrorCode.CHAT_FORBIDDEN,
        message: 'You are not a participant of this chat',
      });
    }
    return offer;
  }

  private counterpartOf(offer: OfferEntity, userId: string): string {
    return offer.proposerId === userId ? offer.recipientId : offer.proposerId;
  }

  private async loadAttachments(
    messageIds: string[],
  ): Promise<Map<string, ChatAttachmentEntity[]>> {
    const map = new Map<string, ChatAttachmentEntity[]>();
    if (!messageIds.length) return map;

    const rows = await this.attachmentsRepo.find({
      where: { messageId: In(messageIds) },
      order: { createdAt: 'ASC' },
    });
    for (const row of rows) {
      if (!row.messageId) continue;
      const list = map.get(row.messageId) ?? [];
      list.push(row);
      map.set(row.messageId, list);
    }
    return map;
  }

  private kindForMime(mime: string): ChatAttachmentKind {
    if ((CHAT_ALLOWED_IMAGE_MIME as readonly string[]).includes(mime)) {
      return ChatAttachmentKind.IMAGE;
    }
    if ((CHAT_ALLOWED_DOC_MIME as readonly string[]).includes(mime)) {
      return ChatAttachmentKind.DOCUMENT;
    }
    throw new BadRequestException({
      code: ChatErrorCode.FILE_WRONG_TYPE,
      message: 'Only PNG, JPG and PDF are allowed',
    });
  }

  private extForMime(mime: string): string {
    switch (mime) {
      case 'image/png':
        return 'png';
      case 'image/jpeg':
        return 'jpg';
      case 'application/pdf':
        return 'pdf';
      default:
        return 'bin';
    }
  }

  private publish(
    userId: string,
    event: Parameters<NotificationsRealtimeService['publish']>[1],
  ): Promise<void> {
    return this.realtime
      .publish(userId, event)
      .catch((err) =>
        this.logger.warn(`Chat realtime publish failed: ${String(err)}`),
      );
  }

  private async emitUnread(userId: string): Promise<void> {
    try {
      const unreadCount = await this.getUnreadCount(userId);
      await this.realtime.publish(userId, { kind: 'chat:unread', unreadCount });
    } catch (err) {
      this.logger.warn(`Chat unread emit failed: ${String(err)}`);
    }
  }

  private toMessageDto(
    message: ChatMessageEntity,
    viewerId: string,
    attachments: ChatAttachmentEntity[],
  ): ChatMessageResponseDto {
    return {
      id: message.id,
      offerId: message.offerId,
      senderId: message.senderId,
      isMine: message.senderId === viewerId,
      text: message.text,
      attachments: attachments.map((a) => this.toAttachmentDto(a)),
      readAt: message.readAt,
      createdAt: message.createdAt,
    };
  }

  private toAttachmentDto(a: ChatAttachmentEntity): ChatAttachmentResponseDto {
    return {
      id: a.id,
      kind: a.kind,
      mimeType: a.mimeType,
      size: a.size,
      originalName: a.originalName,
      scanStatus: a.scanStatus,
    };
  }
}
