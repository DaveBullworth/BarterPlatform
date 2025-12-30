// Импортируем необходимые декораторы и утилиты из NestJS
import {
  Controller,
  Get,
  Req,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
// Импорт сервиса пользователей — тут будет вся бизнес-логика
import { UsersService } from './users.service';
// Guard для аутентификации — проверяет, что пользователь авторизован
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { GetUsersQueryDto, UserResponseDto } from './dto/getAllUsers.dto';
import { RegisterUserDto } from '../auth/dto/register.dto';
import type { AppRequest } from '@/common/interfaces/app-request.interface';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { UserErrorCode } from './errors/users-error-codes';
import { AdminUserDto, SelfUserDto, PublicUserDto } from './dto/getOneUser.dto';

// Декоратор @Controller связывает класс с маршрутом 'users'
@Controller('users')
export class UsersController {
  // Внедряем UsersService через конструктор (Dependency Injection)
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Регистрация пользователя',
    description: `
      Создаёт нового пользователя.

      Процесс:
      1. Проверяется уникальность email и login
      2. Проверяется существование страны
      3. Пароль хешируется
      4. Пользователь сохраняется в БД
      5. Отправляется письмо с подтверждением email
    `,
  })
  @ApiCreatedResponse({
    description: 'Пользователь успешно зарегистрирован',
    schema: {
      example: {
        message: 'Registration successful. Please confirm your email.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Ошибка валидации или бизнес-логики',
    schema: {
      oneOf: [
        {
          example: {
            code: UserErrorCode.EMAIL_ALREADY_IN_USE,
            message: 'Email already in use',
          },
        },
        {
          example: {
            code: UserErrorCode.LOGIN_ALREADY_IN_USE,
            message: 'Login already in use',
          },
        },
        {
          example: {
            code: UserErrorCode.COUNTRY_NOT_FOUND,
            message: 'Country not found',
          },
        },
      ],
    },
  })
  async register(@Body() dto: RegisterUserDto, @Req() req: AppRequest) {
    return this.usersService.register(dto, req);
  }

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
  @ApiInternalServerErrorResponse({
    description: 'Внутренняя ошибка сервера',
  })
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.getAll(query.page ?? 1, query.limit ?? 20);
  }

  // GET-запрос на 'users/:id' для получения конкретного пользователя
  // :id — параметр маршрута
  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Получение пользователя по ID' })
  @ApiOkResponse({
    description: 'Пользователь успешно получен',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(AdminUserDto) },
        { $ref: getSchemaPath(SelfUserDto) },
        { $ref: getSchemaPath(PublicUserDto) },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не найден',
    schema: {
      example: {
        code: UserErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Пользователь деактивирован или доступ запрещен',
    schema: {
      example: {
        code: UserErrorCode.USER_DEACTIVATED,
        message: 'User account is deactivated',
      },
    },
  })
  async getUserById(
    // @Param('id') извлекает параметр id из маршрута
    @Param('id') id: string,
    // берём расшифрованный токен с данными пользователя (id, role)
    @CurrentUser() user: JwtPayload,
  ) {
    // Вызываем сервис для получения одного пользователя по id
    return this.usersService.getById(id, user);
  }
}
