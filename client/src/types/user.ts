import type { UserLanguage } from '@/shared/constants/user-language';
import type { UserTheme } from '@/shared/constants/user-theme';
import type { UserRole } from '@/shared/constants/user-role';

export type GeographyNode = {
  id: number;
  name: string;
};

export interface SelfUserDto {
  id: string;
  role: UserRole;
  email: string;
  login: string;
  name: string;
  phone: string | null;
  region: GeographyNode | null;
  city: GeographyNode | null;
  district: GeographyNode | null;
  status?: boolean;
  statusEmail?: boolean;
  language: UserLanguage;
  theme: UserTheme;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDto {
  id: string;
  role: UserRole;
  email: string;
  login: string;
  name: string;
  phone: string | null;
  region: GeographyNode | null;
  city: GeographyNode | null;
  district: GeographyNode | null;
  status: boolean;
  statusEmail: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserDto {
  id: string;
  login: string;
  name: string;
  region: GeographyNode | null;
  city: GeographyNode | null;
  district: GeographyNode | null;
  createdAt: string;
  updatedAt: string;
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

export interface RegisterUserDto {
  email: string;
  login: string;
  name: string;
  password: string;
  phone?: string;
  regionId: number;
  cityId: number;
  districtId?: number | null;
}

export interface RegisterResponse {
  message: string;
}

export type UpdateSelfUserDto = {
  login?: string;
  name?: string;
  phone?: string | null;
  regionId?: number;
  cityId?: number;
  districtId?: number | null;
  language?: UserLanguage;
  theme?: UserTheme;
};

export type AdminUpdateUserDto = {
  email?: string;
  login?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  status?: boolean;
  statusEmail?: boolean;
  phone?: string | null;
  regionId?: number;
  cityId?: number;
  districtId?: number | null;
};

export interface PaginatedResponse<T> {
  total: number;
  data: T[];
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  sorting?: string;
  filters?: string;
}

export type UserResponseDto = {
  id: string;
  email: string;
  login: string;
  name: string;
  role: UserRole;
  status: boolean;
  phone: string | null;
  region: GeographyNode | null;
  city: GeographyNode | null;
  district: GeographyNode | null;
  createdAt: string;
};
