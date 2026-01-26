import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id?: string;
  login?: string;
  name?: string;
  role?: string;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  id: undefined,
  login: undefined,
  name: undefined,
  role: undefined,
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (
      state,
      // тип аналогичный UserState но исключая поле `isAuthenticated`
      // так как мы его выводим сами
      action: PayloadAction<Omit<UserState, 'isAuthenticated'>>,
    ) => {
      state.id = action.payload.id;
      state.login = action.payload.login;
      state.name = action.payload.name;
      state.role = action.payload.role;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.id = undefined;
      state.login = undefined;
      state.name = undefined;
      state.role = undefined;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken'); // чистим access token
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
