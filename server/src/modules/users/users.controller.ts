// Импортируем необходимые декораторы и утилиты из NestJS
import {
  Controller,
  Get,
  Patch,
  Delete,
  Req,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
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
import { Authenticated } from '../auth/auth.decorator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { GetUsersQueryDto, UserResponseDto } from './dto/getAllUsers.dto';
import { RegisterUserDto } from '../auth/dto/register.dto';
import type { AppRequest } from '@/common/interfaces/app-request.interface';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { UserErrorCode } from './errors/users-error-codes';
import { AdminUserDto, SelfUserDto, PublicUserDto } from './dto/getOneUser.dto';
import { UpdateSelfUserDto } from './dto/updateSelfUser.dto';
import { AdminUpdateUserDto } from './dto/updateUserAdmin.dto';
import { AdminCreateUserDto } from './dto/createUserAdmin.dto';

// Декоратор @Controller связывает класс с маршрутом 'users'
@Controller('user')
@ApiTags('User')
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
  register(@Body() dto: RegisterUserDto, @Req() req: AppRequest) {
    return this.usersService.register(dto, req);
  }

  @ApiBearerAuth()
  @Authenticated()
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
  getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.usersService.getAll(query.page ?? 1, query.limit ?? 20);
  }

  // GET-запрос на 'users/self' для получения пользователя отправившего запрос
  @Authenticated()
  @Get('self')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение данных текущего пользователя' })
  @ApiOkResponse({
    description: 'Текущий пользователь',
    type: SelfUserDto,
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
  getSelf(@CurrentUser() user: JwtPayload) {
    const { sub: userId } = user;
    return this.usersService.getById(userId, user);
  }

  // GET-запрос на 'users/:id' для получения конкретного пользователя
  // :id — параметр маршрута
  @Authenticated()
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение пользователя по ID' })
  @ApiExtraModels(AdminUserDto, SelfUserDto, PublicUserDto)
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
  getUserById(
    // @Param('id') извлекает параметр id из маршрута
    @Param('id') id: string,
    // берём расшифрованный токен с данными пользователя (id, role)
    @CurrentUser() user: JwtPayload,
  ) {
    // Вызываем сервис для получения одного пользователя по id
    return this.usersService.getById(id, user);
  }

  @Authenticated()
  @Patch('self')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновление профиля текущего пользователя',
    description: `
    Позволяет пользователю обновить свои данные и настройки.

    Можно менять:
    - login
    - name
    - phone (включая null)
    - country
    - language
    - theme
  `,
  })
  @ApiBody({ type: UpdateSelfUserDto })
  @ApiOkResponse({
    description: 'Профиль обновлён',
    type: SelfUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Ошибка валидации или бизнес-логики',
    schema: {
      oneOf: [
        // --- бизнес-ошибки ---
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

        // --- ошибки валидации DTO ---
        {
          example: {
            statusCode: 400,
            error: 'Bad Request',
            message: [
              'login must be longer than or equal to 8 characters',
              'login must be a string',
            ],
          },
        },
        {
          example: {
            statusCode: 400,
            error: 'Bad Request',
            message: ['countryId must be a UUID'],
          },
        },
        {
          example: {
            statusCode: 400,
            error: 'Bad Request',
            message: ['language must be a valid enum value'],
          },
        },
      ],
    },
  })
  updateSelf(@Body() dto: UpdateSelfUserDto, @CurrentUser() user: JwtPayload) {
    const { sub: userId } = user;
    return this.usersService.updateSelf(userId, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Authenticated()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Обновление пользователя (ADMIN)',
    description: `
      Позволяет администратору изменять определенные поля пользователя.
    `,
  })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiOkResponse({
    description: 'Пользователь обновлён',
    type: AdminUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Ошибка валидации или бизнес-логики',
    schema: {
      oneOf: [
        {
          example: {
            code: UserErrorCode.LOGIN_ALREADY_IN_USE,
            message: 'Login already in use',
          },
        },
        {
          example: {
            code: UserErrorCode.EMAIL_ALREADY_IN_USE,
            message: 'Email already in use',
          },
        },
        {
          example: {
            code: UserErrorCode.COUNTRY_NOT_FOUND,
            message: 'Country not found',
          },
        },
        {
          example: {
            statusCode: 400,
            error: 'Bad Request',
            message: ['email must be an email'],
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не найден',
  })
  updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdateUser(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Authenticated()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Удаление пользователя (ADMIN)',
    description: `
      Полностью удаляет пользователя по id.
      Доступно только администраторам.
    `,
  })
  @ApiOkResponse({
    description: 'Пользователь удалён',
    schema: {
      example: {
        success: true,
      },
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
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUserByAdmin(id);
  }

  @Post()
  @ApiBearerAuth()
  @Authenticated()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Создание пользователя администратором',
    description: `
    Администратор создаёт пользователя вручную.

    Особенности:
    - password берётся из DEFAULT_PASSWORD
    - status и statusEmail = true
    - language и theme берутся из значений по умолчанию
  `,
  })
  @ApiBody({ type: AdminCreateUserDto })
  @ApiCreatedResponse({
    description: 'Пользователь успешно создан',
    type: AdminUserDto,
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
        {
          example: {
            statusCode: 400,
            error: 'Bad Request',
            message: [
              'email must be an email',
              'login must be longer than or equal to 8 characters',
              'countryId must be a UUID',
            ],
          },
        },
      ],
    },
  })
  createUserByAdmin(@Body() dto: AdminCreateUserDto) {
    return this.usersService.createUserByAdmin(dto);
  }
}
