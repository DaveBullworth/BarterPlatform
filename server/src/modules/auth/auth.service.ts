import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { SessionEntity } from '../../database/entities/session.entity';
import type { JwtPayload } from '@/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    private readonly jwtService: JwtService,
  ) {}

  // Логин
  async login(
    loginOrEmail: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    const user = await this.userRepo.findOne({
      where: [{ email: loginOrEmail }, { login: loginOrEmail }],
    });

    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid password');

    // Генерация токенов
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Хешируем refreshToken для хранения в сессии
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    const session = this.sessionRepo.create({
      user,
      refreshTokenHash: hashedRefresh,
      ip,
      userAgent,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
      status: true,
    });

    await this.sessionRepo.save(session);

    return { accessToken, refreshToken };
  }

  generateAccessToken(user: UserEntity) {
    return this.jwtService.sign(
      { sub: user.id, login: user.login, role: user.role },
      { expiresIn: '15m' },
    );
  }

  generateRefreshToken(user: UserEntity) {
    return this.jwtService.sign(
      { sub: user.id, login: user.login, role: user.role },
      { expiresIn: '7d', secret: process.env.REFRESH_TOKEN_SECRET },
    );
  }

  // Обновление access token через refresh token
  async refresh(refreshToken: string, ip?: string, userAgent?: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      const session = await this.sessionRepo.findOne({
        where: { user: { id: payload.sub }, status: true },
        relations: ['user'],
      });

      if (!session) throw new UnauthorizedException('Session not found');
      const isValid = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash,
      );
      if (!isValid) throw new UnauthorizedException('Invalid refresh token');

      const accessToken = this.generateAccessToken(session.user);
      const newRefreshToken = this.generateRefreshToken(session.user);
      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      console.info(ip, userAgent);
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

  // Выход из системы
  async logout(userId: string, refreshToken: string) {
    const sessions = await this.sessionRepo.find({
      where: { user: { id: userId }, status: true },
    });

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash,
      );
      if (isMatch) {
        session.status = false;
        await this.sessionRepo.save(session);
        return;
      }
    }

    throw new UnauthorizedException();
  }
}
