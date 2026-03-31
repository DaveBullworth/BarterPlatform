import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import appReducer from './appSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    app: appReducer,
  },
});

// Типы для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
