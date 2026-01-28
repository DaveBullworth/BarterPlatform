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
import { UpdateSelfUserDto } from './dto/updateSelfUser.dto';
import { AdminUpdateUserDto } from './dto/updateUserAdmin.dto';
import { AdminCreateUserDto } from './dto/createUserAdmin.dto';
import { AppRequest } from '@/common/interfaces/app-request.interface';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { CountryEntity } from '@/database/entities/country.entity';
import { MailConfirmService } from '../mail-confirm/mail-confirm.service';
import { RedisService } from '@/common/services/redis/redis.service';
import { UserErrorCode } from './errors/users-error-codes';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(CountryEntity)
    private readonly countryRepo: Repository<CountryEntity>,
    private readonly emailConfirmationService: MailConfirmService,
    private readonly redisService: RedisService,
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
      relations: ['country'], // подгружаем связанные страны
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
      country: {
        id: user.country.id,
        name: user.country.name,
        abbreviation: user.country.abbreviation,
        phoneCode: user.country.phoneCode,
        iconPath: user.country.iconPath ?? null,
      },
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

  async updateSelf(userId: string, dto: UpdateSelfUserDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['country'],
    });

    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    // --- login ---
    if (dto.login && dto.login !== user.login) {
      const exists = await this.userRepo.findOne({
        where: { login: dto.login },
      });

      if (exists) {
        throw new BadRequestException({
          code: UserErrorCode.LOGIN_ALREADY_IN_USE,
          message: 'Login already in use',
        });
      }

      user.login = dto.login;
    }

    // --- name ---
    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    // --- phone (null разрешён) ---
    if (dto.phone !== undefined) {
      user.phone = dto.phone; // может быть null
    }

    // --- language ---
    if (dto.language) {
      user.language = dto.language;
    }

    // --- theme ---
    if (dto.theme) {
      user.theme = dto.theme;
    }

    // --- country ---
    if (dto.countryId !== undefined) {
      const country = await this.countryRepo.findOne({
        where: { id: dto.countryId },
      });

      if (!country) {
        throw new BadRequestException({
          code: UserErrorCode.COUNTRY_NOT_FOUND,
          message: 'Country not found',
        });
      }

      user.country = country;
    }

    await this.userRepo.save(user);

    // Обновляем Redis после сохранения
    await this.redisService.updateUserTimestamp(user.id, user.updatedAt);

    return new SelfUserDto(user);
  }

  async adminUpdateUser(userId: string, dto: AdminUpdateUserDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['country'],
    });

    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (exists) {
        throw new BadRequestException({
          code: UserErrorCode.EMAIL_ALREADY_IN_USE,
          message: 'Email already in use',
        });
      }
      user.email = dto.email;
    }

    if (dto.login && dto.login !== user.login) {
      const exists = await this.userRepo.findOne({
        where: { login: dto.login },
      });
      if (exists) {
        throw new BadRequestException({
          code: UserErrorCode.LOGIN_ALREADY_IN_USE,
          message: 'Login already in use',
        });
      }
      user.login = dto.login;
    }

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.status !== undefined) user.status = dto.status;
    if (dto.statusEmail !== undefined) user.statusEmail = dto.statusEmail;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.phone !== undefined) user.phone = dto.phone;

    if (dto.countryId) {
      const country = await this.countryRepo.findOne({
        where: { id: dto.countryId },
      });

      if (!country) {
        throw new BadRequestException({
          code: UserErrorCode.COUNTRY_NOT_FOUND,
          message: 'Country not found',
        });
      }

      user.country = country;
    }

    await this.userRepo.save(user);

    // Обновляем Redis после сохранения
    await this.redisService.updateUserTimestamp(user.id, user.updatedAt);

    return new AdminUserDto(user);
  }

  async deleteUserByAdmin(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    await this.userRepo.remove(user);

    // Обновляем Redis после сохранения
    await this.redisService.deleteUserTimestamp(user.id);

    return {
      success: true,
    };
  }

  async createUserByAdmin(dto: AdminCreateUserDto) {
    const emailExists = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (emailExists) {
      throw new BadRequestException({
        code: UserErrorCode.EMAIL_ALREADY_IN_USE,
        message: 'Email already in use',
      });
    }

    const loginExists = await this.userRepo.findOne({
      where: { login: dto.login },
    });

    if (loginExists) {
      throw new BadRequestException({
        code: UserErrorCode.LOGIN_ALREADY_IN_USE,
        message: 'Login already in use',
      });
    }

    const country = await this.countryRepo.findOne({
      where: { id: dto.countryId },
    });

    if (!country) {
      throw new BadRequestException({
        code: UserErrorCode.COUNTRY_NOT_FOUND,
        message: 'Country not found',
      });
    }

    const defaultPassword = process.env.DEFAULT_PASSWORD || 'default_password';

    const user = this.userRepo.create({
      email: dto.email,
      login: dto.login,
      name: dto.name,
      role: dto.role,
      phone: dto.phone ?? null,
      country,
      password: await bcrypt.hash(defaultPassword, 10),
      status: true,
      statusEmail: true,
    });

    await this.userRepo.save(user);

    // Обновляем Redis после сохранения
    await this.redisService.updateUserTimestamp(user.id, user.updatedAt);

    return new AdminUserDto(user);
  }
}
