import { Controller, Get, Delete, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { Authenticated } from '../auth/auth.decorator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { AuthErrorCode } from '../auth/errors/auth-error-codes';
import { SessionsService } from './sessions.service';
import { SessionResponseDto } from './dto/session-response.dto';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // ===== Свои сессии =====

  @Authenticated()
  @Get()
  @ApiOperation({ summary: 'Список своих активных сессий' })
  @ApiOkResponse({ type: SessionResponseDto, isArray: true })
  getOwnSessions(@CurrentUser() user: JwtPayload) {
    return this.sessionsService.listForUser(user.sub, user.sid);
  }

  @Authenticated()
  @Delete()
  @ApiOperation({
    summary: 'Завершить все остальные свои сессии (кроме текущей)',
  })
  @ApiOkResponse({ schema: { example: { terminated: 2 } } })
  terminateOwnOthers(@CurrentUser() user: JwtPayload) {
    return this.sessionsService.terminateAllForUser(user.sub, user.sid);
  }

  // ===== Сессии пользователя (ADMIN) =====

  @Authenticated()
  @Roles(UserRole.ADMIN)
  @Get('users/:userId')
  @ApiOperation({ summary: 'Список активных сессий пользователя (ADMIN)' })
  @ApiOkResponse({ type: SessionResponseDto, isArray: true })
  @ApiForbiddenResponse({ description: 'Недостаточно прав (только ADMIN)' })
  getUserSessions(@Param('userId') userId: string) {
    return this.sessionsService.listForUser(userId);
  }

  @Authenticated()
  @Roles(UserRole.ADMIN)
  @Delete('users/:userId')
  @ApiOperation({ summary: 'Завершить все сессии пользователя (ADMIN)' })
  @ApiOkResponse({ schema: { example: { terminated: 3 } } })
  @ApiForbiddenResponse({ description: 'Недостаточно прав (только ADMIN)' })
  terminateUserSessions(@Param('userId') userId: string) {
    return this.sessionsService.terminateAllForUser(userId);
  }

  @Authenticated()
  @Roles(UserRole.ADMIN)
  @Delete('users/:userId/:id')
  @ApiOperation({ summary: 'Завершить конкретную сессию пользователя (ADMIN)' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiForbiddenResponse({ description: 'Недостаточно прав (только ADMIN)' })
  @ApiNotFoundResponse({
    schema: { example: { code: AuthErrorCode.SESSION_NOT_FOUND } },
  })
  async terminateUserSession(
    @Param('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.sessionsService.terminateForUser(userId, id);
    return { success: true };
  }

  // ===== Завершение своей конкретной сессии (param-маршрут — последним) =====

  @Authenticated()
  @Delete(':id')
  @ApiOperation({ summary: 'Завершить свою конкретную сессию' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiNotFoundResponse({
    schema: { example: { code: AuthErrorCode.SESSION_NOT_FOUND } },
  })
  async terminateOwnSession(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.sessionsService.terminateForUser(user.sub, id);
    return { success: true };
  }
}
