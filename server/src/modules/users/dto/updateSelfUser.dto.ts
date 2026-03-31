import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, IsInt } from 'class-validator';
import { UserLanguage, UserThemes } from '@/database/entities/user.entity';

export class UpdateSelfUserDto {
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

  @ApiPropertyOptional({
    example: '501234567',
    nullable: true,
    description: 'Телефон. null — удалить',
  })
  @IsOptional()
  @IsString()
  @Length(7, 11)
  phone?: string | null;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  regionId?: number;

  @ApiPropertyOptional({ example: 5003 })
  @IsOptional()
  @IsInt()
  cityId?: number;

  @ApiPropertyOptional({ example: 7002, nullable: true })
  @IsOptional()
  @IsInt()
  districtId?: number | null;

  @ApiPropertyOptional({ enum: UserLanguage })
  @IsOptional()
  @IsEnum(UserLanguage)
  language?: UserLanguage;

  @ApiPropertyOptional({ enum: UserThemes })
  @IsOptional()
  @IsEnum(UserThemes)
  theme?: UserThemes;
}
