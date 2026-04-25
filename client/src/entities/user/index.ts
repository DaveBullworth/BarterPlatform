// Типы
export type {
  SelfUser,
  AdminUser,
  PublicUser,
  AnyUser,
  UpdateSelfUserDto,
  UpdateAdminUserDto,
} from './model';

// Guards и утилиты
export {
  isSelfUser,
  isAdminUser,
  isPublicUser,
  resolveProfileMode,
  type ProfileMode,
} from './lib';

// Хуки данных
export {
  useSelfUser,
  useUserById,
  useUpdateSelfUser,
  useUpdateUserByAdmin,
  useUploadAvatar,
  useDeleteAvatar,
  getUserAvatarUrl,
  userKeys,
} from './api';

// Auth store хук
export { useAuthStore } from './store';
// slice экспортируем отдельно — только для подключения в store
export { default as authReducer } from './store';
