import * as path from 'path';
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Get,
  Res,
  Param,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBody,
  ApiParam,
  ApiProduces,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authenticated } from '../auth/auth.decorator';
import { CurrentUser } from '../auth/user.decorator';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { MediaService } from './media.service';

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('avatar')
  @Authenticated()
  @ApiOperation({ summary: 'Загрузка или обновление аватара пользователя' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Аватар успешно загружен',
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный файл',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Допустимы только изображения'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    const { sub: userId } = user;

    return this.mediaService.uploadUserAvatar(userId, file);
  }

  @ApiOperation({
    summary: 'Получить аватар пользователя',
    description: 'Возвращает изображение аватарки пользователя по userId',
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID пользователя',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiProduces('image/png', 'image/jpeg')
  @ApiResponse({
    status: 200,
    description: 'Аватарка пользователя',
  })
  @ApiResponse({
    status: 404,
    description: 'Аватарка не найдена',
  })
  @Get('avatars/:userId')
  async getUserAvatar(@Param('userId') userId: string, @Res() res: Response) {
    const avatar = await this.mediaService.getUserAvatar(userId);

    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }

    const filePath = path.join(process.cwd(), 'media', avatar.path);

    res.sendFile(filePath);
  }

  @Delete('avatar')
  @Authenticated()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить аватар пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Аватар успешно удалён',
  })
  @ApiResponse({
    status: 404,
    description: 'Аватар не найден',
  })
  async deleteAvatar(@CurrentUser() user: JwtPayload) {
    const { sub: userId } = user;
    return this.mediaService.deleteUserAvatar(userId);
  }
}
