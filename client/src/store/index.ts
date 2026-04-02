import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import appReducer from './appSlice';
import categoryFilterReducer from './categoryFilterSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    app: appReducer,
    categoryFilter: categoryFilterReducer,
  },
});

// Типы для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
