import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { SessionGuard } from './session.guard';
import { UserEntity } from '../../database/entities/user.entity';
import { SessionEntity } from '../../database/entities/session.entity';
import { SessionPolicyService } from './policies/session-policy.service';
import { LoginBruteforcePolicy } from './policies/login-bruteforce.policy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SessionEntity]),
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
    }),
  ],
  providers: [
    AuthService,
    AuthGuard,
    SessionGuard,
    SessionPolicyService,
    LoginBruteforcePolicy,
  ],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard, SessionGuard],
})
export class AuthModule {}
