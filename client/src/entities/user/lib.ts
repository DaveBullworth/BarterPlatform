import type { UserRole } from '@/shared/constants/user-role';
import type { SelfUser, AdminUser, PublicUser, AnyUser } from './model';

// Type guards — были в profile/components/guard.ts
// Теперь живут рядом с типами которые охраняют
// isAdminUser — про SHAPE данных (admin-view с status/statusEmail), не про роль
// смотрящего. Бэк отдаёт AdminUser shape, когда админ смотрит на любого юзера
// (даже обычного) через /user/:id.
export const isSelfUser = (user: AnyUser): user is SelfUser =>
  'language' in user && 'theme' in user;

export const isAdminUser = (user: AnyUser): user is AdminUser =>
  'status' in user && 'statusEmail' in user && !('language' in user);

export const isPublicUser = (user: AnyUser): user is PublicUser =>
  !isSelfUser(user) && !isAdminUser(user);

// Определение режима просмотра профиля
// Была inline логика в ProfilePage — теперь тестируемая функция
export type ProfileMode = 'self' | 'admin' | 'public';

export const resolveProfileMode = (params: {
  viewedId: string | undefined;
  currentUserId: string | undefined;
  currentUserRole: UserRole | undefined;
}): ProfileMode => {
  const { viewedId, currentUserId, currentUserRole } = params;

  if (!viewedId || viewedId === currentUserId) return 'self';
  if (currentUserRole === 'admin') return 'admin';
  return 'public';
};
