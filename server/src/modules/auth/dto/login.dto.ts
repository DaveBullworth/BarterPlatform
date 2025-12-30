import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Логин или email пользователя',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  loginOrEmail: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'Пароль',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(60)
  password: string;
}
