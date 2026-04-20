import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Authenticated } from '../auth/auth.decorator';
import { CurrentUser } from '../auth/user.decorator';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { LotEntity } from '@/database/entities/lot.entity';
import { LotErrorCode } from './errors/lots-error-codes';
import { UserErrorCode } from '../users/errors/users-error-codes';
import { GetLotsQueryDto, LotResponseDto } from './dto/getAllLots.dto';
import { LotFiltersDto } from './dto/lotFilters.dto';
import { OptionalAuthGuard } from '../auth/auth.optinal.guard';

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
        {
          example: {
            code: UserErrorCode.REGION_NOT_FOUND,
            message: 'Region not found',
          },
        },
        {
          example: {
            code: UserErrorCode.CITY_NOT_FOUND,
            message: 'City not found for selected region',
          },
        },
        {
          example: {
            code: UserErrorCode.DISTRICT_NOT_FOUND,
            message: 'District not found for selected city',
          },
        },
      ],
    },
  })
  @ApiConflictResponse({
    description: 'Если подкатегории есть, выбор обязателен',
    schema: {
      example: {
        code: LotErrorCode.SUBCATEGORY_REQUIRED,
        message: 'Subcategory must be selected for this category',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  create(@Body() dto: CreateLotDto, @CurrentUser() user: JwtPayload) {
    return this.lotsService.create(dto, user);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Получение списка лотов',
    description: `
    Возвращает список лотов с учётом прав доступа, пагинации и фильтрации.

    Правила доступа:
    - ADMIN — видит все лоты
    - USER — видит только:
      - активные лоты
      - свои лоты (включая скрытые)

    Параметры:
    - page — номер страницы (по умолчанию 1)
    - limit — количество записей (по умолчанию 20)
    - filters — JSON-фильтры

    Поддерживаемые фильтры:

    ID поля (chapterId, categoryId, subcategoryId, regionId, cityId, districtId):
      - equals — точное совпадение
      - value — строка с id

    query:
      - поиск по generalDescription и characteristicsDescription
      - оператор: contains
  `,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'filters',
    required: false,
    description: 'JSON-объект фильтров лотов',
  })
  @ApiExtraModels(LotResponseDto, LotFiltersDto)
  @ApiOkResponse({
    description: 'Список лотов с пагинацией',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 100 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(LotResponseDto) },
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Пользователь не авторизован',
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  getAll(@Query() query: GetLotsQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.lotsService.getAll({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      filters: query.filters,
      user,
    });
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
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
  getOne(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.lotsService.getOne(id, user);
  }

  @ApiBearerAuth()
  @Authenticated()
  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить лот',
    description: 'Редактирует существующий лот (только владелец) или Админ',
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
    description:
      'Географические данные не найдены для указанных regionId/cityId/districtId',
    schema: {
      oneOf: [
        {
          example: {
            code: UserErrorCode.REGION_NOT_FOUND,
            message: 'Region not found',
          },
        },
        {
          example: {
            code: UserErrorCode.CITY_NOT_FOUND,
            message: 'City not found for selected region',
          },
        },
        {
          example: {
            code: UserErrorCode.DISTRICT_NOT_FOUND,
            message: 'District not found for selected city',
          },
        },
        {
          example: {
            code: LotErrorCode.LOT_NOT_FOND,
            message: 'Lot not found',
          },
        },
      ],
    },
  })
  @ApiConflictResponse({
    description: 'Если подкатегории есть, выбор обязателен',
    schema: {
      example: {
        code: LotErrorCode.SUBCATEGORY_REQUIRED,
        message: 'Subcategory must be selected for this category',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
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
    description: 'Only admin can delete lots.',
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
      example: {
        code: LotErrorCode.NO_ACCESS,
        message: 'Only admin can delete lot',
      },
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
