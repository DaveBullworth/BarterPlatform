import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';
import type { RateLimitState } from './model';

const initialState: RateLimitState = {
  rateLimited: false,
  retryIn: null,
};

export const rateLimitSlice = createSlice({
  name: 'rateLimit',
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

export const { rateLimitHit, rateLimitClear } = rateLimitSlice.actions;

// Локальная типизация — entity не зависит от RootState из app
type SliceState = { rateLimit: RateLimitState };

export const useRateLimit = () => {
  const state = useSelector((s: SliceState) => s.rateLimit);
  const dispatch = useDispatch();

  return {
    rateLimited: state.rateLimited,
    retryIn: state.retryIn,
    hit: (retryAfter: number) => dispatch(rateLimitHit(retryAfter)),
    clear: () => dispatch(rateLimitClear()),
  };
};
