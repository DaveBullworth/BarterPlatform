import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsEmail,
} from 'class-validator';
import { UserRole } from '@/database/entities/user.entity';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  @Length(8, 200)
  email?: string;

  @ApiPropertyOptional({ example: 'new_login' })
  @IsOptional()
  @IsString()
  @Length(8, 60)
  login?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @Length(5, 200)
  name?: string;

  @ApiPropertyOptional({ example: 'StrongPassword123!' })
  @IsOptional()
  @IsString()
  @Length(8, 60)
  password?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  statusEmail?: boolean;

  @ApiPropertyOptional({
    example: '501234567',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(7, 11)
  phone?: string | null;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  countryId?: string;
}
