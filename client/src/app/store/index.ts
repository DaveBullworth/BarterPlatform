import { configureStore } from '@reduxjs/toolkit';
import { appSlice } from './appSlice';
import authReducer from '@/entities/user/store';

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
