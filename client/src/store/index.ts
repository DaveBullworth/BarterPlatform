import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import countriesReducer from './countriesSlice';
import appReducer from './appSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    countries: countriesReducer,
    app: appReducer,
    // сюда потом добавим ui, lots, chat и т.д.
  },
});

// Типы для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
