import type { UserLanguage } from '@/shared/constants/user-language';
import type { UserTheme } from '@/shared/constants/user-theme';
import type { UserRole } from '@/shared/constants/user-role';
import type { Country } from './country';

export interface SelfUserDto {
  id: string;
  role: UserRole;
  email: string;
  login: string;
  name: string;
  phone: string | null;
  country: Country | null;
  language: UserLanguage;
  theme: UserTheme;
  createdAt: string;
}

export interface LoginDto {
  loginOrEmail: string;
  password: string;
  remember: boolean;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
}
