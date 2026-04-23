import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
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
import { MailConfirmService } from '../mail-confirm/mail-confirm.service';
import { UserErrorCode } from './errors/users-error-codes';
import { UserFiltersDto } from './dto/userFilters.dto';
import { SortItemDto } from '@/common/dtos/sort-item.dto';
import { applyTextFilter as applyTextFilterImported } from '@/common/utils/query-filters.util';
import { GeographyService } from './geography.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly emailConfirmationService: MailConfirmService,
    private readonly geographyService: GeographyService,
  ) {}

  private detectLanguage(req: AppRequest): UserLanguage {
    const header = req.headers['accept-language'];
    if (!header) return UserLanguage.EN;

    const lang = header.split(',')[0].toLowerCase();

    if (lang.startsWith('pl')) return UserLanguage.PL;
    if (lang.startsWith('ru')) return UserLanguage.RU;
    if (lang.startsWith('de')) return UserLanguage.DE;

    return UserLanguage.EN;
  }

  private applyTextFilter = applyTextFilterImported<UserEntity>;

  private applyUserIdFilter(
    qb: SelectQueryBuilder<UserEntity>,
    field: 'regionId' | 'cityId' | 'districtId',
    operator: 'contains' | 'equals' | 'not_contains' | 'not_equals',
    values: string[],
  ) {
    const ids = values.map((v) => Number(v)).filter((v) => Number.isFinite(v));
    if (!ids.length) return;

    if (operator === 'contains' || operator === 'equals') {
      qb.andWhere(`user.${field} IN (:...ids_${field})`, {
        [`ids_${field}`]: ids,
      });
      return;
    }

    qb.andWhere(
      `(user.${field} IS NULL OR user.${field} NOT IN (:...ids_${field}))`,
      { [`ids_${field}`]: ids },
    );
  }

  async register(dto: RegisterUserDto, req: AppRequest) {
    const emailExists = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (emailExists) {
      throw new ConflictException({
        code: UserErrorCode.EMAIL_ALREADY_IN_USE,
        message: 'Email already in use',
      });
    }

    const loginExists = await this.userRepo.findOne({
      where: { login: dto.login },
    });
    if (loginExists) {
      throw new ConflictException({
        code: UserErrorCode.LOGIN_ALREADY_IN_USE,
        message: 'Login already in use',
      });
    }

    this.geographyService.validate(
      dto.regionId,
      dto.cityId,
      dto.districtId ?? null,
    );

    const language = this.detectLanguage(req);
    const theme = UserThemes.SYSTEM;
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      email: dto.email,
      login: dto.login,
      name: dto.name,
      password: passwordHash,
      phone: dto.phone,
      regionId: dto.regionId,
      cityId: dto.cityId,
      districtId: dto.districtId ?? null,
      role: UserRole.USER,
      status: true,
      statusEmail: false,
      language,
      theme,
    });

    await this.userRepo.save(user);
    await this.emailConfirmationService.createAndSendToken(user);

    return { message: 'Registration successful. Please confirm your email.' };
  }

  async getAll(params: {
    page: number;
    limit: number;
    sorting?: SortItemDto[];
    filters?: UserFiltersDto;
  }): Promise<{ data: UserResponseDto[]; total: number }> {
    const { page, limit, sorting, filters } = params;

    const qb = this.userRepo.createQueryBuilder('user');

    if (filters?.login)
      this.applyTextFilter(qb, 'user.login', filters.login, 'login');
    if (filters?.name)
      this.applyTextFilter(qb, 'user.name', filters.name, 'name');
    if (filters?.email)
      this.applyTextFilter(qb, 'user.email', filters.email, 'email');
    if (filters?.phone)
      this.applyTextFilter(qb, 'user.phone', filters.phone, 'phone');

    if (filters?.status) {
      qb.andWhere('user.status = :status', { status: filters.status.value });
    }

    if (filters?.role) {
      qb.andWhere('user.role = :role', {
        role: filters.role.value ? UserRole.ADMIN : UserRole.USER,
      });
    }

    if (filters?.region) {
      this.applyUserIdFilter(
        qb,
        'regionId',
        filters.region.operator,
        filters.region.values,
      );
    }

    if (filters?.city) {
      this.applyUserIdFilter(
        qb,
        'cityId',
        filters.city.operator,
        filters.city.values,
      );
    }

    if (filters?.district) {
      this.applyUserIdFilter(
        qb,
        'districtId',
        filters.district.operator,
        filters.district.values,
      );
    }

    if (filters?.createdAt) {
      const [from, to] = filters.createdAt.values;
      if (from && to) {
        qb.andWhere('user.createdAt BETWEEN :from AND :to', {
          from: new Date(from),
          to: new Date(to),
        });
      }
    }

    if (sorting && sorting.length > 0) {
      const allowedFields = [
        'email',
        'login',
        'name',
        'role',
        'phone',
        'status',
        'createdAt',
        'regionId',
        'cityId',
        'districtId',
      ];

      for (const sort of sorting) {
        if (allowedFields.includes(sort.id)) {
          qb.addOrderBy(`user.${sort.id}`, sort.desc ? 'DESC' : 'ASC');
        }
      }
    } else {
      qb.addOrderBy('user.createdAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);
    const [users, total] = await qb.getManyAndCount();

    return {
      total,
      data: users.map((user) => this.toResponseDto(user)),
    };
  }

  private toResponseDto(user: UserEntity): UserResponseDto {
    const geo = this.geographyService.build({
      regionId: user.regionId,
      cityId: user.cityId,
      districtId: user.districtId,
    });
    return {
      id: user.id,
      email: user.email,
      login: user.login,
      name: user.name,
      role: user.role,
      status: user.status,
      phone: user.phone,
      region: geo.region,
      city: geo.city,
      district: geo.district,
      createdAt: user.createdAt,
    };
  }

  async getById(targetUserId: string, requester: JwtPayload) {
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });

    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    const geo = this.geographyService.build({
      regionId: user.regionId,
      cityId: user.cityId,
      districtId: user.districtId,
    });

    if (requester.role === UserRole.ADMIN && requester.sub !== user.id) {
      return new AdminUserDto(user, geo);
    }

    if (requester.role === UserRole.ADMIN && requester.sub === user.id) {
      return new SelfUserDto(user, geo, { includeAdminFields: true });
    }

    if (requester.sub === user.id) {
      return new SelfUserDto(user, geo);
    }

    if (!user.status) {
      throw new ForbiddenException({
        code: UserErrorCode.USER_DEACTIVATED,
        message: 'User account is deactivated',
      });
    }

    return new PublicUserDto(user, geo);
  }

  async updateSelf(userId: string, dto: UpdateSelfUserDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    if (dto.login && dto.login !== user.login) {
      const exists = await this.userRepo.findOne({
        where: { login: dto.login },
      });
      if (exists) {
        throw new ConflictException({
          code: UserErrorCode.LOGIN_ALREADY_IN_USE,
          message: 'Login already in use',
        });
      }
      user.login = dto.login;
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.language) user.language = dto.language;
    if (dto.theme) user.theme = dto.theme;

    const nextRegionId = dto.regionId ?? user.regionId;
    const nextCityId = dto.cityId ?? user.cityId;
    const nextDistrictId =
      dto.districtId !== undefined ? dto.districtId : user.districtId;

    if (nextRegionId && nextCityId) {
      this.geographyService.validate(
        nextRegionId,
        nextCityId,
        nextDistrictId ?? null,
      );
      user.regionId = nextRegionId;
      user.cityId = nextCityId;
      user.districtId = nextDistrictId ?? null;
    }

    await this.userRepo.save(user);

    return new SelfUserDto(
      user,
      this.geographyService.build({
        regionId: user.regionId,
        cityId: user.cityId,
        districtId: user.districtId,
      }),
    );
  }

  async adminUpdateUser(userId: string, dto: AdminUpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const isActive = user.status === true;
    const isEmailActive = user.statusEmail === true;

    const wantsDeactivateStatus =
      dto.status !== undefined && user.status === true && dto.status === false;

    const wantsDeactivateStatusEmail =
      dto.statusEmail !== undefined &&
      user.statusEmail === true &&
      dto.statusEmail === false;

    if (
      isAdmin &&
      isActive &&
      isEmailActive &&
      (wantsDeactivateStatus || wantsDeactivateStatusEmail)
    ) {
      const activeAdminsCount = await this.userRepo.count({
        where: {
          role: UserRole.ADMIN,
          status: true,
          statusEmail: true,
        },
      });

      if (activeAdminsCount <= 1) {
        throw new ConflictException({
          code: UserErrorCode.LAST_ADMIN_DEACTIVATION_FORBIDDEN,
          message: 'Cannot deactivate the last active admin',
        });
      }
    }

    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (exists) {
        throw new ConflictException({
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
        throw new ConflictException({
          code: UserErrorCode.LOGIN_ALREADY_IN_USE,
          message: 'Login already in use',
        });
      }
      user.login = dto.login;
    }

    if (dto.password) user.password = await bcrypt.hash(dto.password, 10);
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.status !== undefined) user.status = dto.status;
    if (dto.statusEmail !== undefined) user.statusEmail = dto.statusEmail;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.phone !== undefined) user.phone = dto.phone;

    const nextRegionId = dto.regionId ?? user.regionId;
    const nextCityId = dto.cityId ?? user.cityId;
    const nextDistrictId =
      dto.districtId !== undefined ? dto.districtId : user.districtId;

    if (nextRegionId && nextCityId) {
      this.geographyService.validate(
        nextRegionId,
        nextCityId,
        nextDistrictId ?? null,
      );
      user.regionId = nextRegionId;
      user.cityId = nextCityId;
      user.districtId = nextDistrictId ?? null;
    }

    await this.userRepo.save(user);

    return new AdminUserDto(
      user,
      this.geographyService.build({
        regionId: user.regionId,
        cityId: user.cityId,
        districtId: user.districtId,
      }),
    );
  }

  async deleteUserByAdmin(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    await this.userRepo.remove(user);

    return { success: true };
  }

  async createUserByAdmin(dto: AdminCreateUserDto) {
    const emailExists = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (emailExists) {
      throw new ConflictException({
        code: UserErrorCode.EMAIL_ALREADY_IN_USE,
        message: 'Email already in use',
      });
    }

    const loginExists = await this.userRepo.findOne({
      where: { login: dto.login },
    });
    if (loginExists) {
      throw new ConflictException({
        code: UserErrorCode.LOGIN_ALREADY_IN_USE,
        message: 'Login already in use',
      });
    }

    this.geographyService.validate(
      dto.regionId,
      dto.cityId,
      dto.districtId ?? null,
    );

    const defaultPassword = process.env.DEFAULT_PASSWORD || 'default_password';

    const user = this.userRepo.create({
      email: dto.email,
      login: dto.login,
      name: dto.name,
      role: dto.role,
      phone: dto.phone ?? null,
      regionId: dto.regionId,
      cityId: dto.cityId,
      districtId: dto.districtId ?? null,
      password: await bcrypt.hash(defaultPassword, 10),
      status: true,
      statusEmail: true,
    });

    await this.userRepo.save(user);

    return new AdminUserDto(
      user,
      this.geographyService.build({
        regionId: user.regionId,
        cityId: user.cityId,
        districtId: user.districtId,
      }),
    );
  }
}
