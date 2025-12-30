import { IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@/database/entities/user.entity';

export class GetUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CountryResponseDto {
  id: string;
  name: string;
  abbreviation: string;
  phoneCode: number;
  iconPath?: string | null;
}

export class UserResponseDto {
  id: string;
  email: string;
  login: string;
  name: string;
  role: UserRole;
  status: boolean;
  phone: string | null;
  createdAt: Date;
  country?: CountryResponseDto | null;
}
