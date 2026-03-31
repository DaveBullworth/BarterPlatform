import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';
import type { UserRole } from '@/shared/constants/user-role';
import type { UserTheme } from '@/shared/constants/user-theme';
import type { UserLanguage } from '@/shared/constants/user-language';

export interface UserEntry {
  id: string;
  login?: string;
  name?: string;
  role?: UserRole;
  email?: string;
  phone?: string | null;
  language?: UserLanguage;
  theme?: UserTheme;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersState {
  entities: Record<string, UserEntry>;
  currentUserId?: string;
  isAuthenticated: boolean;
}

const initialState: UsersState = {
  entities: {},
  currentUserId: undefined,
  isAuthenticated: false,
};

const slice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Устанавливаем/обновляем текущего залогиненного пользователя
    setCurrentUser: (state, action: PayloadAction<UserEntry>) => {
      const u = action.payload;
      state.entities[u.id] = { ...state.entities[u.id], ...u };
      state.currentUserId = u.id;
      state.isAuthenticated = true;
      // token management left to thunks/components (localStorage) — как было раньше
    },

    // Вставка/обновление произвольного пользователя (для view-by-id)
    upsertUser: (state, action: PayloadAction<UserEntry>) => {
      const u = action.payload;
      state.entities[u.id] = { ...state.entities[u.id], ...u };
    },

    // Удаляем пользователя из entities (редко нужно)
    removeUser: (state, action: PayloadAction<{ id: string }>) => {
      delete state.entities[action.payload.id];
      if (state.currentUserId === action.payload.id) {
        state.currentUserId = undefined;
        state.isAuthenticated = false;
      }
    },

    // Разлогинивание текущего
    logout: (state) => {
      state.currentUserId = undefined;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
    },
  },
});

export const { setCurrentUser, upsertUser, removeUser, logout } = slice.actions;
export default slice.reducer;

/* ---- Selectors ---- */
export const selectUsersState = (s: RootState) => s.user;

export const selectCurrentUser = (s: RootState): UserEntry | undefined => {
  const st = s.user;
  if (!st.currentUserId) return undefined;
  return st.entities[st.currentUserId];
};

export const selectUserById =
  (id: string) =>
  (s: RootState): UserEntry | undefined =>
    s.user.entities[id];

export const selectIsAuthenticated = (s: RootState) => s.user.isAuthenticated;
