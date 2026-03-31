import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  IsInt,
} from 'class-validator';
import { UserRole } from '@/database/entities/user.entity';

export class AdminCreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @Length(8, 200)
  email: string;

  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @Length(8, 60)
  login: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @Length(5, 200)
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: '501234567', nullable: true, required: false })
  @IsOptional()
  @IsString()
  @Length(7, 11)
  phone?: string | null;

  @ApiProperty({ example: 5 })
  @IsInt()
  regionId: number;

  @ApiProperty({ example: 5003 })
  @IsInt()
  cityId: number;

  @ApiProperty({ example: 7002, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  districtId?: number | null;
}
