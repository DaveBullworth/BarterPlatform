import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '@/shared/constants/user-role';
import type { UserTheme } from '@/shared/constants/user-theme';
import type { UserLanguage } from '@/shared/constants/user-language';
import type { Country } from '@/types/country';

interface UserState {
  id?: string;
  login?: string;
  name?: string;
  role?: UserRole;
  email?: string;
  phone?: string | null;
  country?: Country | null;
  language?: UserLanguage;
  theme?: UserTheme;
  createdAt?: string;
  updatedAt?: string;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  id: undefined,
  login: undefined,
  name: undefined,
  role: undefined,
  email: undefined,
  phone: undefined,
  country: undefined,
  language: undefined,
  theme: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<Omit<UserState, 'isAuthenticated'>>,
    ) => {
      Object.assign(state, action.payload); // сразу все поля
      state.isAuthenticated = true;
    },
    logout: (state) => {
      // чистим все поля
      state.id = undefined;
      state.login = undefined;
      state.name = undefined;
      state.role = undefined;
      state.email = undefined;
      state.phone = undefined;
      state.country = undefined;
      state.language = undefined;
      state.theme = undefined;
      state.createdAt = undefined;
      state.updatedAt = undefined;
      state.isAuthenticated = false;

      // чистим токен
      localStorage.removeItem('accessToken');
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
