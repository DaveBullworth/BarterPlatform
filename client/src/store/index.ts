import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import appReducer from './appSlice';
import categoryFilterReducer from './categoryFilterSlice';
import geographyReducer from './geographySlice';
import taxonomyReducer from './taxonomySlice';
import searchFilterReducer from './searchFilterSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    app: appReducer,
    categoryFilter: categoryFilterReducer,
    searchFilter: searchFilterReducer,
    geography: geographyReducer,
    taxonomy: taxonomyReducer,
  },
});

// Типы для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
