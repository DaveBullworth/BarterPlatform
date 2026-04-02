import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';
import type { CategorySelection } from '@/types/taxonomy';

type CategoryFilterState = {
  selected: CategorySelection | null;
};

const initialState: CategoryFilterState = {
  selected: null,
};

const slice = createSlice({
  name: 'categoryFilter',
  initialState,
  reducers: {
    setCategorySelection: (state, action: PayloadAction<CategorySelection>) => {
      state.selected = action.payload;
    },
    clearCategorySelection: (state) => {
      state.selected = null;
    },
  },
});

export const { setCategorySelection, clearCategorySelection } = slice.actions;
export default slice.reducer;

export const selectCategorySelection = (s: RootState) =>
  s.categoryFilter.selected;
