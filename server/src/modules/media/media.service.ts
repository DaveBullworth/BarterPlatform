import * as path from 'path';
import * as fs from 'fs/promises';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Jimp } from 'jimp';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MediaFileEntity,
  MediaFileType,
  MediaFileVisibility,
} from '@/database/entities/mediafile.entity';
import { UserEntity } from '@/database/entities/user.entity';
import logger from '@/common/services/logger/logger';

// создаём тип точно для multer
type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

@Injectable()
export class MediaService {
  private readonly basePath = path.join(process.cwd(), 'media', 'avatars');

  constructor(
    @InjectRepository(MediaFileEntity)
    private readonly mediaRepository: Repository<MediaFileEntity>,
  ) {}

  async uploadUserAvatar(userId: string, file: UploadedImageFile) {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new BadRequestException('Поддерживаются только PNG и JPG');
    }

    // папка пользователя
    const userDir = path.join(this.basePath, userId);
    await fs.mkdir(userDir, { recursive: true });

    const filename = 'avatar.png';
    const filePath = path.join(userDir, filename);

    try {
      // читаем изображение
      const image = await Jimp.read(file.buffer);

      // обрезка и ресайз
      image.cover({ w: 300, h: 300 });

      // сохраняем изображение
      await image.write(filePath as `${string}.png`);
    } catch (err) {
      const status = 500;
      const message = 'Ошибка обработки изображения';
      const stack = err instanceof Error ? err.stack : undefined;

      // логируем только ошибки 500+
      if (status >= 500) {
        logger.error(
          `${'POST'} ${'/avatar'} ${status} -- ${message}`,
          stack ? { stack } : undefined,
        );
      }

      // безопасный выброс ошибки
      throw new InternalServerErrorException({
        cause: err instanceof Error ? err : undefined,
        description: message,
      });
    }

    // удаляем старый аватар (если был)
    await this.mediaRepository.delete({
      user: { id: userId },
      type: MediaFileType.AVATAR,
    });

    const media = this.mediaRepository.create({
      type: MediaFileType.AVATAR,
      visibility: MediaFileVisibility.PUBLIC,
      mimeType: 'image/png',
      size: file.size,
      path: `avatars/${userId}/${filename}`,
      user: { id: userId } as UserEntity,
    });

    await this.mediaRepository.save(media);

    return {
      message: 'Аватар успешно загружен',
    };
  }

  async getUserAvatar(userId: string): Promise<MediaFileEntity | null> {
    return this.mediaRepository.findOne({
      where: {
        user: { id: userId },
        type: MediaFileType.AVATAR,
      },
    });
  }

  async deleteUserAvatar(userId: string) {
    const avatar = await this.mediaRepository.findOne({
      where: {
        user: { id: userId },
        type: MediaFileType.AVATAR,
      },
    });

    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }

    const filePath = path.join(process.cwd(), 'media', avatar.path);

    try {
      await fs.unlink(filePath);
    } catch (err) {
      // файл мог быть уже удалён — это не критично
      logger.warn(
        `Avatar file missing on delete: ${filePath}`,
        err instanceof Error ? { stack: err.stack } : undefined,
      );
    }

    await this.mediaRepository.delete({ id: avatar.id });

    return {
      message: 'Аватар успешно удалён',
    };
  }
}
