import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';

type SearchState = {
  query: string;
};

const initialState: SearchState = {
  query: '',
};

const slice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    clearSearchQuery: (state) => {
      state.query = '';
    },
  },
});

export const { setSearchQuery, clearSearchQuery } = slice.actions;
export default slice.reducer;

export const selectSearchQuery = (s: RootState) => s.searchFilter.query;
