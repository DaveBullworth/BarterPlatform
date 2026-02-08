import type { SelfUserDto, AdminUserDto, PublicUserDto } from '@/types/user';

// Guards чтобы сразу понимать тип `user` сейчас
export function isSelfUser(
  user: SelfUserDto | AdminUserDto | PublicUserDto,
): user is SelfUserDto {
  return 'language' in user && 'theme' in user;
}

export function isAdminUser(
  user: SelfUserDto | AdminUserDto | PublicUserDto,
): user is AdminUserDto {
  return 'email' in user && 'status' in user;
}
