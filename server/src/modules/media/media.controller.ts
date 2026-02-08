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
  Query,
  UseGuards,
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
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/user.decorator';
import { MediaService } from './media.service';
import { OwnerOrAdminGuard } from './owner.guard';
import { AuthGuard } from '../auth/auth.guard';
import { SessionGuard } from '../auth/session.guard';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('avatar')
  @UseGuards(AuthGuard, SessionGuard, OwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Загрузка или обновление аватара текущего пользователя или другого пользователя (только для администратора)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'userId',
    required: false,
    description:
      'ID пользователя. Если не указан — загружается аватар текущего пользователя. Доступ к чужому аватару разрешён только администратору.',
    type: String,
  })
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
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав для загрузки аватара другого пользователя',
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
    @Query('userId') targetUserId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    const userIdToUpload = targetUserId ?? user.sub;

    return this.mediaService.uploadUserAvatar(userIdToUpload, file);
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
  @UseGuards(AuthGuard, SessionGuard, OwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Удалить аватар текущего пользователя или другого пользователя (только для администратора)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description:
      'ID пользователя. Если не указан — удаляется аватар текущего пользователя. Доступ к чужому аватару разрешён только администратору.',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Аватар успешно удалён',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав для удаления аватара другого пользователя',
  })
  @ApiResponse({
    status: 404,
    description: 'Аватар не найден',
  })
  async deleteAvatar(
    @CurrentUser() user: JwtPayload,
    @Query('userId') targetUserId?: string,
  ) {
    const userIdToDelete = targetUserId ?? user.sub;
    return this.mediaService.deleteUserAvatar(userIdToDelete);
  }
}
