import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'user@mail.com' })
  @IsEmail()
  @MinLength(8)
  @MaxLength(200)
  email: string;

  @ApiProperty({ example: 'cool_user' })
  @IsString()
  @MinLength(8)
  @MaxLength(60)
  login: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(60)
  password: string;

  @ApiProperty({ example: '123456789', required: false })
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(11)
  phone?: string;

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
