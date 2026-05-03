import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/app/store';
import type { UserRole } from '@/shared/constants/user-role';

// Минимум — только то что нужно глобально
type AuthState = {
  isAuthenticated: boolean;
  currentUserId: string | null;
  currentUserRole: string | null;
};

const initialState: AuthState = {
  isAuthenticated: false,
  currentUserId: null,
  currentUserRole: null,
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authenticated: (
      state,
      action: PayloadAction<{
        id: string;
        role: string;
      }>,
    ) => {
      state.isAuthenticated = true;
      state.currentUserId = action.payload.id;
      state.currentUserRole = action.payload.role;
    },
    loggedOut: (state) => {
      state.isAuthenticated = false;
      state.currentUserId = null;
      state.currentUserRole = null;

      localStorage.removeItem('accessToken');
    },
  },
});

export const { authenticated, loggedOut } = slice.actions;
export default slice.reducer;

// Хук — компоненты не знают о структуре Redux
// Импортируют useAuthStore а не useSelector + RootState
export const useAuthStore = () => {
  const dispatch = useDispatch();
  const state = useSelector((s: RootState) => s.auth);

  return {
    isAuthenticated: state.isAuthenticated,
    currentUser: state.currentUserId
      ? {
          id: state.currentUserId,
          role: state.currentUserRole as UserRole | undefined,
        }
      : null,
    authenticate: (payload: { id: string; role: string }) =>
      dispatch(authenticated(payload)),
    logout: () => dispatch(loggedOut()),
  };
};
