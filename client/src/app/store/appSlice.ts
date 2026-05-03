import { useSelector } from 'react-redux';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';

type AppState = {
  rateLimited: boolean;
  retryIn: number | null;
};

const initialState: AppState = {
  rateLimited: false,
  retryIn: null,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    rateLimitHit: (state, action: PayloadAction<number>) => {
      state.rateLimited = true;
      state.retryIn = action.payload;
    },
    rateLimitClear: (state) => {
      state.rateLimited = false;
      state.retryIn = null;
    },
  },
});

export const { rateLimitHit, rateLimitClear } = appSlice.actions;

// Хук — инкапсулируем useSelector
export const useAppState = () => {
  return useSelector((s: RootState) => s.app);
};
