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
  Body,
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
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/user.decorator';
import { MediaService } from './media.service';
import { OwnerOrAdminGuard } from './owner.guard';
import { AuthGuard } from '../auth/auth.guard';
import { SessionGuard } from '../auth/session.guard';
import {
  GetLotsMainImagesDto,
  GetLotsMainImagesResponse,
} from './dto/get-lots-main-images.dto';
import { SetPrimaryLotImageDto } from './dto/set-primary-lot-image.dto';
import { MediaErrorCode } from '../auth/errors/auth-error-codes';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { LotErrorCode } from '../lots/errors/lots-error-codes';
import { GetLotImagesResponse } from './dto/get-lot-images.dto';

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
  @ApiBadRequestResponse({
    description: 'Ошибка типа входных данных',
    schema: {
      example: {
        code: MediaErrorCode.WRONG_TYPE,
        message: 'Поддерживаются только PNG и JPG',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Ошибка обработки изображения',
    schema: {
      example: {
        code: MediaErrorCode.AVATAR_PROCESSING_ERROR,
        message: 'Ошибка обработки изображения',
        cause: 'Error',
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
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

  @Post('lots/:lotId/images')
  @UseGuards(AuthGuard, SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Загрузка изображения лота (до 3 изображений на лот)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'lotId',
    description: 'ID лота',
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
    description: 'Изображение лота успешно загружено',
  })
  @ApiBadRequestResponse({
    description: 'Ошибка типа входных данных',
    schema: {
      example: {
        code: MediaErrorCode.WRONG_TYPE,
        message: 'Поддерживаются только PNG и JPG',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Недостаточно прав',
    schema: {
      example: {
        code: MediaErrorCode.NO_ACCESS,
        message: 'Недостаточно прав для изменения изображений',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Лот не найден',
    schema: {
      example: {
        code: LotErrorCode.LOT_NOT_FOND,
        message: 'Лот не найден',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Лимит на количество изображений для одного лота',
    schema: {
      example: {
        code: MediaErrorCode.MAX_LOT_IMG,
        message: 'У лота может быть максимум 3 изображения',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Ошибка обработки изображения',
    schema: {
      example: {
        code: MediaErrorCode.AVATAR_PROCESSING_ERROR,
        message: 'Ошибка обработки изображения',
        cause: 'Error',
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 8 * 1024 * 1024,
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
  async uploadLotImage(
    @Param('lotId') lotId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }

    return this.mediaService.uploadLotImage(lotId, file, user);
  }

  @Post('lots/:lotId/images/primary')
  @UseGuards(AuthGuard, SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Установить главное изображение лота',
  })
  @ApiExtraModels(SetPrimaryLotImageDto)
  @ApiBody({ type: SetPrimaryLotImageDto })
  @ApiParam({
    name: 'lotId',
    description: 'ID лота',
  })
  @ApiOkResponse({
    description: 'Главное изображение обновлено',
  })
  @ApiForbiddenResponse({
    description: 'Недостаточно прав',
    schema: {
      example: {
        code: MediaErrorCode.NO_ACCESS,
        message: 'Недостаточно прав для изменения изображений',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Лот/Изображение не найдены',
    schema: {
      oneOf: [
        {
          example: {
            code: LotErrorCode.LOT_NOT_FOND,
            message: 'Лот не найден',
          },
        },
        {
          example: {
            code: MediaErrorCode.IMG_NOT_FOUND,
            message: 'Изображение не найдено',
          },
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  async setPrimaryLotImage(
    @Param('lotId') lotId: string,
    @Body() dto: SetPrimaryLotImageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.mediaService.setPrimaryLotImage(lotId, dto.imageId, user);
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
  @ApiOkResponse({
    description: 'Аватарка пользователя',
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
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

  @Get('lots/images/:imageId/original')
  @ApiOperation({
    summary: 'Получить одно конкретное изображение лота (без сжатия)',
  })
  @ApiParam({
    name: 'lotId',
    description: 'UUID лота',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Изображение лота',
  })
  @ApiNotFoundResponse({
    description: 'Изображение не найдено',
    schema: {
      example: {
        code: MediaErrorCode.IMG_NOT_FOUND,
        message: 'Изображение лота не найдено',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  async getLotOriginalImage(
    @Param('imageId') imageId: string,
    @Res() res: Response,
  ) {
    const filePath = await this.mediaService.getLotImageFile(
      imageId,
      'original',
    );
    res.sendFile(filePath);
  }

  @Get('lots/:lotId/images')
  @ApiOperation({
    summary:
      'Получить все изображения одного лота (немного сжатые, base64) для карусели',
    description:
      'Возвращает все изображения указанного лота, включая флаг основного изображения. Данные изображений закодированы в base64.',
  })
  @ApiExtraModels(GetLotImagesResponse)
  @ApiOkResponse({
    description: 'Массив изображений лота успешно получен',
    type: GetLotImagesResponse,
  })
  @ApiNotFoundResponse({
    description: 'Лот/Изображение не найдены',
    schema: {
      oneOf: [
        {
          example: {
            code: LotErrorCode.LOT_NOT_FOND,
            message: 'Лот не найден',
          },
        },
        {
          example: {
            code: MediaErrorCode.IMG_NOT_FOUND,
            message: 'Изображение лота не найдено',
          },
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  async getLotImages(@Param('lotId') lotId: string) {
    return this.mediaService.getLotImagesCompressed(lotId);
  }

  @Post('lots/main-images')
  @ApiBody({ type: GetLotsMainImagesDto })
  @ApiExtraModels(GetLotsMainImagesDto, GetLotsMainImagesResponse)
  @ApiOperation({
    summary:
      'Получить главные изображения для массива лотов (сильно сжатые, base64) для каталогов',
    description:
      'Эндпоинт принимает массив UUID лотов и возвращает их главные изображения в сильно сжатом виде (base64). Если изображение отсутствует, поля imageId, mimeType и data будут null.',
  })
  @ApiOkResponse({
    description: 'Главные изображения лотов успешно получены',
    type: GetLotsMainImagesResponse,
  })
  @ApiBadRequestResponse({
    description:
      'Некорректный запрос (например, пустой массив или неверные UUID)',
  })
  @ApiNotFoundResponse({
    description: 'Изображение не найдено',
    schema: {
      example: {
        code: MediaErrorCode.IMG_NOT_FOUND,
        message: 'Изображение лота не найдено',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  async getLotsMainImages(@Body() dto: GetLotsMainImagesDto) {
    return this.mediaService.getLotsMainImagesTiny(dto.lotIds);
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
  @ApiOkResponse({
    description: 'Аватар успешно удалён',
  })
  @ApiNotFoundResponse({
    description: 'Аватар не найден',
    schema: {
      example: {
        code: MediaErrorCode.AVATAR_NOT_FOUND,
        message: 'Avatar not found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  async deleteAvatar(
    @CurrentUser() user: JwtPayload,
    @Query('userId') targetUserId?: string,
  ) {
    const userIdToDelete = targetUserId ?? user.sub;
    return this.mediaService.deleteUserAvatar(userIdToDelete);
  }

  @Delete('lots/images/:imageId')
  @UseGuards(AuthGuard, SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Удалить изображение лота',
  })
  @ApiOkResponse({
    description: 'Изображение лота удалено',
  })
  @ApiForbiddenResponse({
    description: 'Недостаточно прав',
    schema: {
      example: {
        code: MediaErrorCode.NO_ACCESS,
        message: 'Недостаточно прав для удаления изображений',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Лот/Изображение не найдены',
    schema: {
      oneOf: [
        {
          example: {
            code: LotErrorCode.LOT_NOT_FOND,
            message: 'Лот не найден',
          },
        },
        {
          example: {
            code: MediaErrorCode.IMG_NOT_FOUND,
            message: 'Изображение не найдено',
          },
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  async deleteLotImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.mediaService.deleteLotImage(imageId, user);
  }
}
