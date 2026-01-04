import { UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { SessionGuard } from './session.guard';
import { RolesGuard } from './roles.guard';

export const Authenticated = () =>
  UseGuards(AuthGuard, SessionGuard, RolesGuard);
