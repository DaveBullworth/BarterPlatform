import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/entities/user/store';
import { rateLimitSlice } from '@/entities/rate-limit';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rateLimit: rateLimitSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
