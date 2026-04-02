import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authenticated } from '../auth/auth.decorator';
import { CurrentUser } from '../auth/user.decorator';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { LotEntity } from '@/database/entities/lot.entity';
import { LotErrorCode } from './errors/lots-error-codes';

@Controller('lot')
@ApiTags('Lot')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Get('taxonomy')
  @ApiOperation({
    summary: 'Получить категорийное дерево',
    description: 'Возвращает иерархию: раздел → категории → подкатегории',
  })
  @ApiOkResponse({
    description: 'Категорийное дерево успешно получено',
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  getTaxonomy() {
    return this.lotsService.getTaxonomy();
  }

  @ApiBearerAuth()
  @Authenticated()
  @Post()
  @ApiOperation({
    summary: 'Создать лот',
    description: 'Создаёт новый лот от имени текущего пользователя',
  })
  @ApiResponse({
    status: 201,
    description: 'Лот успешно создан',
    type: LotEntity,
  })
  @ApiBadRequestResponse({
    description: 'Ошибка валидации входных данных',
  })
  @ApiForbiddenResponse({
    description: 'Пользователь не авторизован',
  })
  @ApiNotFoundResponse({
    description: 'Раздел/Категория/Подкатегория не найдены',
    schema: {
      oneOf: [
        {
          example: {
            code: LotErrorCode.CHAPTER_NOT_FOUND,
            message: 'Chapter not found',
          },
        },
        {
          example: {
            code: LotErrorCode.CATEGORY_NOT_FOUND,
            message: 'Category not found in chapter',
          },
        },
        {
          example: {
            code: LotErrorCode.SUBCATEGORY_NOT_FOUND,
            message: 'Subcategory not found in category',
          },
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  create(@Body() dto: CreateLotDto, @CurrentUser() user: JwtPayload) {
    return this.lotsService.create(dto, user);
  }

  @ApiBearerAuth()
  @Authenticated()
  @Get()
  @ApiOperation({
    summary: 'Получить список лотов',
    description: 'Возвращает список лотов с учётом прав доступа и видимости',
  })
  @ApiOkResponse({
    description: 'Список лотов',
    type: [LotEntity],
  })
  @ApiForbiddenResponse({
    description: 'Пользователь не авторизован',
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  getAll(@CurrentUser() user: JwtPayload) {
    return this.lotsService.getAll(user);
  }

  @ApiBearerAuth()
  @Authenticated()
  @Get(':id')
  @ApiOperation({
    summary: 'Получить лот по ID',
    description: 'Возвращает лот с учётом прав доступа и видимости',
  })
  @ApiParam({
    name: 'id',
    example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01',
    description: 'ID лота',
  })
  @ApiOkResponse({
    description: 'Лот найден',
    type: LotEntity,
  })
  @ApiNotFoundResponse({
    description: 'Лот не найден',
    schema: {
      example: {
        code: LotErrorCode.LOT_NOT_FOND,
        message: 'Lot not found',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Пользователь не авторизован или не имеет доступа к лоту',
    schema: {
      example: {
        code: LotErrorCode.NO_ACCESS,
        message: 'No access to this lot',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.lotsService.getOne(id, user);
  }

  @ApiBearerAuth()
  @Authenticated()
  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить лот',
    description: 'Редактирует существующий лот (только владелец)',
  })
  @ApiParam({
    name: 'id',
    example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01',
    description: 'ID лота',
  })
  @ApiOkResponse({
    description: 'Лот успешно обновлён',
    type: LotEntity,
  })
  @ApiForbiddenResponse({
    description: 'Нет прав на редактирование',
    schema: {
      oneOf: [
        {
          example: {
            code: LotErrorCode.NOT_OWNER,
            message: 'Only owner can update lot',
          },
        },
        {
          example: {
            code: LotErrorCode.USER_ARCHIVED,
            message: 'Archived lots cannot be edited by user',
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Лот не найден',
    schema: {
      example: {
        code: LotErrorCode.LOT_NOT_FOND,
        message: 'Lot not found',
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLotDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lotsService.update(id, dto, user);
  }

  @ApiBearerAuth()
  @Authenticated()
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete lot',
    description:
      'Admin can delete any lot. Regular user can delete only own non-archived lots.',
  })
  @ApiParam({
    name: 'id',
    example: 'c2a1e2a5-8b44-4c71-aee4-0d2c2e7b0c01',
    description: 'Lot ID',
  })
  @ApiOkResponse({
    description: 'Lot deleted successfully',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'No rights to delete this lot',
    schema: {
      oneOf: [
        {
          example: {
            code: LotErrorCode.NOT_OWNER,
            message: 'Only owner can delete lot',
          },
        },
        {
          example: {
            code: LotErrorCode.USER_ARCHIVED,
            message: 'Archived lots cannot be deleted by user',
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Lot not found',
    schema: {
      example: {
        code: LotErrorCode.LOT_NOT_FOND,
        message: 'Lot not found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.lotsService.remove(id, user);
  }
}
