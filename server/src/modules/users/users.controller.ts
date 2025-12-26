// Импортируем необходимые декораторы и утилиты из NestJS
import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
// Импорт сервиса пользователей — тут будет вся бизнес-логика
import { UsersService } from './users.service';
// Guard для аутентификации — проверяет, что пользователь авторизован
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { GetUsersQueryDto, UserResponseDto } from './dto/getAllUsers.dto';

// Декоратор @Controller связывает класс с маршрутом 'users'
@Controller('users')
export class UsersController {
  // Внедряем UsersService через конструктор (Dependency Injection)
  constructor(private readonly usersService: UsersService) {}

  @ApiTags('Users')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Получение списка пользователей (только для администратора)',
    description: `
    Возвращает всех пользователей с пагинацией.
    Доступ только для пользователей с ролью "ADMIN".
    Каждая запись содержит основные поля пользователя и вложенную информацию о связанной стране.

    Параметры запроса:
    - page — номер страницы (по умолчанию 1)
    - limit — количество записей на страницу (по умолчанию 20)
    `,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiExtraModels(UserResponseDto)
  @ApiResponse({
    status: 200,
    description: 'Список пользователей с пагинацией',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 123 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(UserResponseDto) },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован (отсутствует или неверный access token)',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (только ADMIN)',
  })
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.getAll(query.page ?? 1, query.limit ?? 20);
  }

  // GET-запрос на 'users/:id' для получения конкретного пользователя
  // :id — параметр маршрута
  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserById(
    // @Param('id') извлекает параметр id из маршрута
    @Param('id') id: string,
  ) {
    // Вызываем сервис для получения одного пользователя по id
    return this.usersService.getById(id);
  }
}
