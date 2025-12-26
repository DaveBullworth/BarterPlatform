import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Логин или email пользователя',
  })
  @IsString()
  loginOrEmail: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'Пароль',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
