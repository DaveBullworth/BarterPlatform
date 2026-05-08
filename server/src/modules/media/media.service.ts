import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { UserEntity, UserRole } from '@/database/entities/user.entity';
import { LotEntity } from '@/database/entities/lot.entity';
import { MediaErrorCode } from '../auth/errors/auth-error-codes';
import { LotErrorCode } from '../lots/errors/lots-error-codes';
import logger from '@/common/services/logger/logger';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

type LotImageSize = 'original' | 'compressed' | 'tiny';

@Injectable()
export class MediaService {
  private readonly avatarsPath = path.join(process.cwd(), 'media', 'avatars');
  private readonly lotsPath = path.join(process.cwd(), 'media', 'lots');

  constructor(
    @InjectRepository(MediaFileEntity)
    private readonly mediaRepository: Repository<MediaFileEntity>,
    @InjectRepository(LotEntity)
    private readonly lotsRepository: Repository<LotEntity>,
  ) {}

  private validateImageMime(file: UploadedImageFile) {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new BadRequestException({
        code: MediaErrorCode.WRONG_TYPE,
        message: 'Поддерживаются только PNG и JPG',
      });
    }
  }

  private async getManageableLot(lotId: string, user: JwtPayload) {
    const lot = await this.lotsRepository.findOne({ where: { id: lotId } });
    if (!lot) {
      throw new NotFoundException({
        code: LotErrorCode.LOT_NOT_FOND,
        message: 'Лот не найден',
      });
    }

    const canManage = user.role === UserRole.ADMIN || lot.userId === user.sub;
    if (!canManage) {
      throw new ForbiddenException({
        code: MediaErrorCode.NO_ACCESS,
        message: 'Недостаточно прав для изменения изображений',
      });
    }

    return lot;
  }

  private async syncLotImageLinks(lotId: string) {
    const lot = await this.lotsRepository.findOne({ where: { id: lotId } });
    if (!lot) return;

    const lotImages = await this.mediaRepository.find({
      where: { lotId, type: MediaFileType.LOT_IMAGE },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });

    lot.imageLinks = lotImages.map(
      (img) => `/media/lots/images/${img.id}/original`,
    );

    await this.lotsRepository.save(lot);
  }

  private getLotImagePaths(lotId: string, imageId: string) {
    return {
      original: path.join(this.lotsPath, lotId, `${imageId}.png`),
      compressed: path.join(this.lotsPath, lotId, `${imageId}.compressed.png`),
      tiny: path.join(this.lotsPath, lotId, `${imageId}.tiny.png`),
    };
  }

  private async createLotImageVersions(
    lotId: string,
    imageId: string,
    file: UploadedImageFile,
  ) {
    const lotDir = path.join(this.lotsPath, lotId);
    await fs.mkdir(lotDir, { recursive: true });

    const versions = this.getLotImagePaths(lotId, imageId);

    try {
      const image = await Jimp.read(file.buffer);

      const original = image.clone();
      original.scaleToFit({ w: 2000, h: 2000 });
      await original.write(versions.original as `${string}.png`);

      const compressed = image.clone();
      compressed.scaleToFit({ w: 1100, h: 1100 });
      await compressed.write(versions.compressed as `${string}.png`);

      const tiny = image.clone();
      tiny.scaleToFit({ w: 320, h: 320 });
      await tiny.write(versions.tiny as `${string}.png`);
    } catch (err) {
      throw new InternalServerErrorException({
        message: 'Ошибка обработки изображения лота',
        cause: err instanceof Error ? err : undefined,
      });
    }
  }

  async uploadUserAvatar(userId: string, file: UploadedImageFile) {
    this.validateImageMime(file);

    const userDir = path.join(this.avatarsPath, userId);
    await fs.mkdir(userDir, { recursive: true });

    const filename = 'avatar.png';
    const filePath = path.join(userDir, filename);

    try {
      const image = await Jimp.read(file.buffer);
      image.cover({ w: 300, h: 300 });
      await image.write(filePath as `${string}.png`);
    } catch (err) {
      const stack = err instanceof Error ? err.stack : undefined;
      logger.error(
        `${'POST'} ${'/avatar'} ${500} -- ${'Ошибка обработки изображения'}`,
        stack ? { stack } : undefined,
      );

      throw new InternalServerErrorException({
        code: MediaErrorCode.AVATAR_PROCESSING_ERROR,
        description: 'Ошибка обработки изображения',
        cause: err instanceof Error ? err : undefined,
      });
    }

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
      lotId: null,
      isPrimary: false,
      user: { id: userId } as UserEntity,
    });

    await this.mediaRepository.save(media);

    return { message: 'Аватар успешно загружен' };
  }

  async uploadLotImage(
    lotId: string,
    file: UploadedImageFile,
    user: JwtPayload,
  ) {
    this.validateImageMime(file);
    await this.getManageableLot(lotId, user);

    const existing = await this.mediaRepository.find({
      where: { lotId, type: MediaFileType.LOT_IMAGE },
      order: { createdAt: 'ASC' },
    });

    if (existing.length >= 3) {
      throw new ConflictException({
        code: MediaErrorCode.MAX_LOT_IMG,
        message: 'У лота может быть максимум 3 изображения',
      });
    }

    const imageId = randomUUID();
    await this.createLotImageVersions(lotId, imageId, file);

    const media = this.mediaRepository.create({
      id: imageId,
      type: MediaFileType.LOT_IMAGE,
      visibility: MediaFileVisibility.PUBLIC,
      mimeType: 'image/png',
      size: file.size,
      path: `lots/${lotId}/${imageId}.png`,
      lotId,
      isPrimary: existing.length === 0,
      user: { id: user.sub } as UserEntity,
    });

    await this.mediaRepository.save(media);
    await this.syncLotImageLinks(lotId);

    return {
      message: 'Изображение лота успешно загружено',
      imageId,
      isPrimary: media.isPrimary,
    };
  }

  async setPrimaryLotImage(lotId: string, imageId: string, user: JwtPayload) {
    await this.getManageableLot(lotId, user);

    const target = await this.mediaRepository.findOne({
      where: { id: imageId, lotId, type: MediaFileType.LOT_IMAGE },
    });

    if (!target) {
      throw new NotFoundException({
        code: MediaErrorCode.IMG_NOT_FOUND,
        message: 'Изображение лота не найдено',
      });
    }

    await this.mediaRepository.update(
      { lotId, type: MediaFileType.LOT_IMAGE },
      { isPrimary: false },
    );

    await this.mediaRepository.update({ id: imageId }, { isPrimary: true });
    await this.syncLotImageLinks(lotId);

    return { message: 'Главное изображение обновлено' };
  }

  async deleteLotImage(imageId: string, user: JwtPayload) {
    const image = await this.mediaRepository.findOne({
      where: { id: imageId, type: MediaFileType.LOT_IMAGE },
    });

    if (!image || !image.lotId) {
      throw new NotFoundException({
        code: MediaErrorCode.IMG_NOT_FOUND,
        message: 'Изображение лота не найдено',
      });
    }

    await this.getManageableLot(image.lotId, user);

    const versions = this.getLotImagePaths(image.lotId, image.id);
    for (const filePath of Object.values(versions)) {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        logger.warn(
          `Lot image file missing on delete: ${filePath}`,
          err instanceof Error ? { stack: err.stack } : undefined,
        );
      }
    }

    await this.mediaRepository.delete({ id: image.id });

    if (image.isPrimary) {
      const fallback = await this.mediaRepository.findOne({
        where: { lotId: image.lotId, type: MediaFileType.LOT_IMAGE },
        order: { createdAt: 'ASC' },
      });

      if (fallback) {
        await this.mediaRepository.update(
          { id: fallback.id },
          { isPrimary: true },
        );
      }
    }

    await this.syncLotImageLinks(image.lotId);

    return { message: 'Изображение лота удалено' };
  }

  async getLotImageFile(imageId: string, size: LotImageSize) {
    const image = await this.mediaRepository.findOne({
      where: { id: imageId, type: MediaFileType.LOT_IMAGE },
    });

    if (!image || !image.lotId) {
      throw new NotFoundException({
        code: MediaErrorCode.IMG_NOT_FOUND,
        message: 'Изображение лота не найдено',
      });
    }

    return this.getLotImagePaths(image.lotId, image.id)[size];
  }

  async getLotImagesCompressed(lotId: string) {
    const lot = await this.lotsRepository.findOne({ where: { id: lotId } });
    if (!lot) {
      throw new NotFoundException({
        code: LotErrorCode.LOT_NOT_FOND,
        message: 'Лот не найден',
      });
    }

    const images = await this.mediaRepository.find({
      where: { lotId, type: MediaFileType.LOT_IMAGE },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });

    const payload = await Promise.all(
      images.map(async (image) => {
        const compressedPath = await this.getLotImageFile(
          image.id,
          'compressed',
        );
        try {
          const binary = await fs.readFile(compressedPath);
          return {
            imageId: image.id,
            isPrimary: image.isPrimary,
            mimeType: 'image/png',
            data: binary.toString('base64'),
          };
        } catch (err) {
          if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err;
          logger.warn(
            `Lot image file missing on read: ${compressedPath}`,
            err instanceof Error ? { stack: err.stack } : undefined,
          );
          return null;
        }
      }),
    );

    return { lotId, images: payload.filter((item) => item !== null) };
  }

  async getLotsMainImagesTiny(lotIds: string[]) {
    const uniqueLotIds = [...new Set(lotIds)];

    const results = await Promise.all(
      uniqueLotIds.map(async (lotId) => {
        const mainImage = await this.mediaRepository.findOne({
          where: {
            lotId,
            type: MediaFileType.LOT_IMAGE,
            isPrimary: true,
          },
        });

        if (!mainImage) {
          return {
            lotId,
            imageId: null,
            mimeType: null,
            data: null,
          };
        }

        const tinyPath = await this.getLotImageFile(mainImage.id, 'tiny');
        try {
          const binary = await fs.readFile(tinyPath);
          return {
            lotId,
            imageId: mainImage.id,
            mimeType: 'image/png',
            data: binary.toString('base64'),
          };
        } catch (err) {
          if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err;
          logger.warn(
            `Lot image file missing on read: ${tinyPath}`,
            err instanceof Error ? { stack: err.stack } : undefined,
          );
          return {
            lotId,
            imageId: null,
            mimeType: null,
            data: null,
          };
        }
      }),
    );

    return { items: results };
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
      throw new NotFoundException({
        code: MediaErrorCode.AVATAR_NOT_FOUND,
        message: 'Avatar not found',
      });
    }

    const filePath = path.join(process.cwd(), 'media', avatar.path);

    try {
      await fs.unlink(filePath);
    } catch (err) {
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
