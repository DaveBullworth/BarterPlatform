import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import appReducer from './appSlice';
import categoryFilterReducer from './categoryFilterSlice';
import geographyReducer from './geographySlice';
import taxonomyReducer from './taxonomySlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    app: appReducer,
    categoryFilter: categoryFilterReducer,
    geography: geographyReducer,
    taxonomy: taxonomyReducer,
  },
});

// Типы для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
