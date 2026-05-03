// Типы
export type {
  SelfUser,
  AdminUser,
  PublicUser,
  AnyUser,
  UpdateSelfUserDto,
  UpdateAdminUserDto,
  UserFilters,
} from './model';

// Cхемы валидации
export {
  SelfUserSchema,
  AdminUserSchema,
  PublicUserSchema,
  UpdateSelfUserSchema,
  UpdateAdminUserSchema,
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
  useUploadAvatar,
  useDeleteAvatar,
  getUserAvatarUrl,
  userApi,
  userKeys,
} from './api';

// Auth store хук
export { useAuthStore } from './store';
// slice экспортируем отдельно — только для подключения в store
export { default as authReducer } from './store';
// Экшены для использования в других местах приложения
export { authenticated, loggedOut } from './store';
