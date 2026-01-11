import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import {
  UserEntity,
  UserLanguage,
  UserThemes,
  UserRole,
} from '@/database/entities/user.entity';
import { UserResponseDto } from './dto/getAllUsers.dto';
import { RegisterUserDto } from '../auth/dto/register.dto';
import { AdminUserDto, SelfUserDto, PublicUserDto } from './dto/getOneUser.dto';
import { AppRequest } from '@/common/interfaces/app-request.interface';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { CountryEntity } from '@/database/entities/country.entity';
import { MailConfirmService } from '../mail-confirm/mail-confirm.service';
import { UserErrorCode } from './errors/users-error-codes';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(CountryEntity)
    private readonly countryRepo: Repository<CountryEntity>,
    private readonly emailConfirmationService: MailConfirmService,
  ) {}

  // Метод определения языка пользователя по заголовку запроса
  private detectLanguage(req: AppRequest): UserLanguage {
    const header = req.headers['accept-language'];
    if (!header) return UserLanguage.EN;

    const lang = header.split(',')[0].toLowerCase();

    if (lang.startsWith('pl')) return UserLanguage.PL;
    if (lang.startsWith('ru')) return UserLanguage.RU;
    if (lang.startsWith('de')) return UserLanguage.DE;

    return UserLanguage.EN;
  }

  async register(dto: RegisterUserDto, req: AppRequest) {
    /** Проверка email */
    const emailExists = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (emailExists) {
      throw new BadRequestException({
        code: UserErrorCode.EMAIL_ALREADY_IN_USE,
        message: 'Email already in use',
      });
    }

    /** Проверка логина */
    const loginExists = await this.userRepo.findOne({
      where: { login: dto.login },
    });

    if (loginExists) {
      throw new BadRequestException({
        code: UserErrorCode.LOGIN_ALREADY_IN_USE,
        message: 'Login already in use',
      });
    }

    /** Проверка страны */
    const country = await this.countryRepo.findOne({
      where: { id: dto.countryId },
    });

    if (!country) {
      throw new BadRequestException({
        code: UserErrorCode.COUNTRY_NOT_FOUND,
        message: 'Country not found',
      });
    }

    /** Язык пользователя */
    const language = this.detectLanguage(req);

    /** Тема (по умолчанию system) */
    const theme = UserThemes.SYSTEM;

    /** Хеширование пароля */
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Создание записи в БД
    const user = this.userRepo.create({
      email: dto.email,
      login: dto.login,
      name: dto.name,
      password: passwordHash,
      phone: dto.phone,
      role: UserRole.USER,
      status: true,
      statusEmail: false,
      country,
      language,
      theme,
    });

    await this.userRepo.save(user);

    /* 
      После сохранения пользователя — делегируем ответственному сервису
      и создание хеша для подтверждающей ссылки и отпрвку самого письма
      с этой ссылкой на соответствующую почту 
    */
    await this.emailConfirmationService.createAndSendToken(user);

    return {
      message: 'Registration successful. Please confirm your email.',
    };
  }

  async getAll(
    page: number,
    limit: number,
  ): Promise<{ data: UserResponseDto[]; total: number }> {
    const [users, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['country'], // 🔹 подгружаем связанные страны
    });

    return {
      total,
      data: users.map((user) => this.toResponseDto(user)),
    };
  }

  private toResponseDto(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      login: user.login,
      name: user.name,
      role: user.role,
      status: user.status,
      phone: user.phone,
      createdAt: user.createdAt,
      country: user.country
        ? {
            id: user.country.id,
            name: user.country.name,
            abbreviation: user.country.abbreviation,
            phoneCode: user.country.phoneCode,
            iconPath: user.country.iconPath ?? null,
          }
        : null,
    };
  }

  async getById(targetUserId: string, requester: JwtPayload) {
    const user = await this.userRepo.findOne({
      where: { id: targetUserId },
      relations: ['country'],
    });

    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    // Админ — видит всё
    if (requester.role === UserRole.ADMIN) {
      return new AdminUserDto(user);
    }

    // Пользователь смотрит сам себя
    if (requester.sub === user.id) {
      return new SelfUserDto(user);
    }

    // Чужой пользователь, но аккаунт деактивирован
    if (!user.status) {
      // маскируем существование
      throw new ForbiddenException({
        code: UserErrorCode.USER_DEACTIVATED,
        message: 'User account is deactivated',
      });
    }

    return new PublicUserDto(user);
  }
}
