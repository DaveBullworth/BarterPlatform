import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  loginOrEmail: string;

  @IsString()
  @MinLength(6)
  password: string;
}
