import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
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

  @ApiProperty({
    example: '501234567',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(7, 11)
  phone?: string | null;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  countryId: string;
}
