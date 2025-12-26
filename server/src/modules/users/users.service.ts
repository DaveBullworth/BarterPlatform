import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { UserResponseDto } from './dto/getAllUsers.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

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

  async getById(id: string) {
    return this.userRepo.findOneBy({ id });
  }
}
