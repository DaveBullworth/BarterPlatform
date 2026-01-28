import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  rateLimited: boolean;
  retryIn: number | null;
}

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
export default appSlice.reducer;
