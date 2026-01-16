import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class PasswordResetConfirmDto {
  @ApiProperty({
    description: 'Токен из ссылки (raw)',
    example: '9f1a7e...',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Новый пароль',
    example: 'StrongP@ssw0rd',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(60)
  newPassword: string;
}
