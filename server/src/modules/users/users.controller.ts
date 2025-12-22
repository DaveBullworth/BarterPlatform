// Импортируем необходимые декораторы и утилиты из NestJS
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
// Импорт сервиса пользователей — тут будет вся бизнес-логика
import { UsersService } from './users.service';
// Guard для аутентификации — проверяет, что пользователь авторизован
import { AuthGuard } from '../auth/auth.guard';

// Декоратор @Controller связывает класс с маршрутом 'users'
@Controller('users')
export class UsersController {
  // Внедряем UsersService через конструктор (Dependency Injection)
  constructor(private readonly usersService: UsersService) {}

  // GET-запрос на 'users' для получения всех пользователей
  // @UseGuards(AuthGuard) защищает маршрут — только авторизованные пользователи могут обращаться
  @UseGuards(AuthGuard)
  @Get()
  async getAllUsers() {
    // Вызываем сервис для получения списка всех пользователей
    return this.usersService.getAll();
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
