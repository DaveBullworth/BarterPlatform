import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  UserEntity,
  UserRole,
  UserLanguage,
  UserThemes,
} from '@/database/entities/user.entity';
import { GeographyNodeDto } from '@/common/dtos/geo-node.dto';

type UserGeo = {
  region: GeographyNodeDto | null;
  city: GeographyNodeDto | null;
  district: GeographyNodeDto | null;
};

export class AdminUserDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role!: UserRole;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'userlogin' })
  login!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: '+1234567890' })
  phone!: string;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  region!: GeographyNodeDto | null;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  city!: GeographyNodeDto | null;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  district!: GeographyNodeDto | null;

  @ApiProperty({ example: true })
  status!: boolean;

  @ApiProperty({ example: false })
  statusEmail!: boolean;

  @ApiProperty({ example: '2025-12-30T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-12-30T12:00:00.000Z' })
  updatedAt!: Date;

  constructor(user: UserEntity, geo: UserGeo) {
    Object.assign(this, {
      id: user.id,
      role: user.role,
      email: user.email,
      login: user.login,
      name: user.name,
      phone: user.phone,
      region: geo.region,
      city: geo.city,
      district: geo.district,
      status: user.status,
      statusEmail: user.statusEmail,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}

export class SelfUserDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role!: UserRole;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'userlogin' })
  login!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: '+1234567890' })
  phone!: string;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  region!: GeographyNodeDto | null;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  city!: GeographyNodeDto | null;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  district!: GeographyNodeDto | null;

  @ApiPropertyOptional({ example: true })
  status?: boolean;

  @ApiPropertyOptional({ example: false })
  statusEmail?: boolean;

  @ApiProperty({ enum: UserLanguage, example: UserLanguage.RU })
  language!: UserLanguage;

  @ApiProperty({ enum: UserThemes, example: UserThemes.DARK })
  theme!: UserThemes;

  @ApiProperty({ example: '2025-12-30T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-12-30T12:00:00.000Z' })
  updatedAt!: Date;

  constructor(
    user: UserEntity,
    geo: UserGeo,
    options?: { includeAdminFields?: boolean },
  ) {
    Object.assign(this, {
      id: user.id,
      role: user.role,
      email: user.email,
      login: user.login,
      name: user.name,
      phone: user.phone,
      region: geo.region,
      city: geo.city,
      district: geo.district,
      language: user.language,
      theme: user.theme,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    if (options?.includeAdminFields) {
      this.status = user.status;
      this.statusEmail = user.statusEmail;
    }
  }
}

export class PublicUserDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'userlogin' })
  login!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  region!: GeographyNodeDto | null;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  city!: GeographyNodeDto | null;

  @ApiPropertyOptional({ type: () => GeographyNodeDto, nullable: true })
  district!: GeographyNodeDto | null;

  @ApiProperty({ example: '2025-12-30T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-12-30T12:00:00.000Z' })
  updatedAt!: Date;

  constructor(user: UserEntity, geo: UserGeo) {
    Object.assign(this, {
      id: user.id,
      login: user.login,
      name: user.name,
      region: geo.region,
      city: geo.city,
      district: geo.district,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
