import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetRequestDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  @IsEmail()
  email: string;
}

export enum PasswordResetRequestResult {
  SENT = 'sent',
  ALREADY_REQUESTED = 'already_requested',
}
